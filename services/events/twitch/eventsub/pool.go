package eventsub

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/tools/security"
)

var Pools map[string]*Pool = make(map[string]*Pool)

type PoolEventHookFunc func(message *EventSubMessage, subscription *Subscription)

var PoolEventHook PoolEventHookFunc

type AccessTokenGetter func() (string, error)

type Subscription struct {
	Id        string
	Type      string
	Version   string
	Condition map[string]string
}

type PoolStatus int

const (
	STOPPED PoolStatus = iota
	STARTING
	CONNECTED
	RECONNECTING
	DISCONNECTED
	STOPPING
	ERRORED
)

func (w PoolStatus) String() string {
	switch w {
	case STOPPED:
		return "stopped"
	case STARTING:
		return "starting"
	case CONNECTED:
		return "connected"
	case RECONNECTING:
		return "reconnecting"
	case DISCONNECTED:
		return "disconnected"
	case STOPPING:
		return "stopping"
	case ERRORED:
		return "errored"
	}
	return "unknown"
}

type Pool struct {
	Id            string
	Status        PoolStatus
	SessionId     string
	Subscriptions map[string]*Subscription
	Error         error
	Socket        *websocket.Conn
	Done          <-chan struct{}
}

func (pool *Pool) IsAvailable() bool {
	if pool.Status != CONNECTED {
		return false
	}

	if len(pool.Subscriptions) >= max_listeners_per_pool {
		return false
	}

	return true
}

func (pool *Pool) Close() error {
	if pool.Socket == nil {
		return errors.New("tried to close uninitialized pool")
	}

	if pool.Status == STOPPED || pool.Status == ERRORED {
		return errors.New("already closed")
	}

	pool.Status = STOPPING
	pool.Socket.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))

	select {
	case <-pool.Done:
		break
	case <-time.After(3 * time.Second):
		pool.Socket.Close()
		pool.Status = ERRORED
		return errors.New("pool wouldn't close gracefully")
	}

	pool.Socket.Close()
	pool.Status = STOPPED

	return nil
}

func (pool *Pool) Connect(url string) error {
	if pool.Status != STARTING && pool.Status != RECONNECTING {
		return errors.New("invalid state for pool to connect")
	}

	ws, _, err := websocket.DefaultDialer.Dial(url, nil)
	if err != nil {
		errors.Join(errors.New("pool failed to dial"), err)
	}

	done := make(chan struct{})
	welcome := make(chan string)

	/*
		Goroutine for handling messages.

		Rules:
		- The routine should not set the pool status unless its RECONNECTING or ERRORED
	*/
	go func() {
		defer close(welcome)
		defer close(done)

		var keepalive *time.Timer
		var keepalive_duration time.Duration
		welcome_sent := false

		for {
			var message EventSubMessage
			err := ws.ReadJSON(&message)
			if err != nil {
				if !welcome_sent {
					welcome <- "error"
				}
				pool.Error = err
				break
			}

			switch message.Metadata.MessageType {
			case "session_welcome":
				if welcome_sent {
					continue
				}

				keepalive_timeout := message.Payload["session"].(map[string]any)["keepalive_timeout_seconds"].(float64)
				keepalive_duration = time.Second * time.Duration(keepalive_timeout+3) // We add a bit of extra buffer cause twitch is slow
				keepalive = time.NewTimer(keepalive_duration)
				// Reconnect if keepalive times out
				go func() {
					<-keepalive.C
					if len(pool.Subscriptions) == 0 {
						pool.Close()
					} else {
						pool.Status = RECONNECTING
						pool.Connect(event_sub_url)
					}
				}()

				welcome <- message.Payload["session"].(map[string]any)["id"].(string)
				welcome_sent = true
			case "session_keepalive":
				keepalive.Reset(keepalive_duration)
			case "session_reconnect":
				pool.Status = RECONNECTING
				reconnect_url := message.Payload["session"].(map[string]any)["reconnect_url"].(string)
				err := pool.Connect(reconnect_url)
				if err != nil {
					pool.Status = ERRORED
					pool.Error = err
				}
				return // Reconnect success
			case "revocation":
				subscription_id := message.Payload["subscription"].(map[string]any)["id"].(string)

				delete(pool.Subscriptions, subscription_id)
			case "notification":
				keepalive.Reset(keepalive_duration)
				if PoolEventHook == nil {
					break
				}

				subscription_id := message.Payload["subscription"].(map[string]any)["id"].(string)
				subscription := pool.Subscriptions[subscription_id]

				if subscription == nil {
					println("got a message for an unknown subscription")
					break
				}

				PoolEventHook(&message, subscription)
			}
		}
	}()

	select {
	case session_id := <-welcome:
		if session_id == "error" {
			return errors.New("pool got disconnected before welcome message")
		}

		pool.SessionId = session_id

		if pool.Status == RECONNECTING {
			for id := range pool.Subscriptions {
				pool.Resubscribe(id)
			}

			pool.Close()
		}

		pool.Status = CONNECTED
		break
	case <-time.After(5 * time.Second):
		pool.Status = ERRORED
		pool.Close()
		return errors.New("session id was never received")
	}

	pool.Socket = ws
	pool.Done = done
	pool.Error = nil

	return nil
}

func (pool *Pool) request_subscription(
	subscriptionType string,
	subscriptionVersion string,
	subscriptionCondition map[string]string,
	accessToken string,
) (*SubscriptionResponse, error) {
	clientId := pb.Settings().TwitchAuth.ClientId

	subscription_request := SubscriptionRequest{
		Type:      subscriptionType,
		Version:   subscriptionVersion,
		Condition: subscriptionCondition,
		Transport: WebsocketTransport(pool.SessionId),
	}

	body, err := json.Marshal(subscription_request)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", subscriptions_url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Client-Id", clientId)

	var result SubscriptionResponse
	{
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			return nil, errors.Join(errors.New("failed to request subscription"), err)
		}
		defer resp.Body.Close()
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, errors.Join(errors.New("reading subscription request body failed"), err)
		}

		if resp.StatusCode >= 400 {
			return nil, errors.New("subscription request failed: " + string(body))
		}

		{
			err := json.Unmarshal(body, &result)
			if err != nil {
				return nil, errors.Join(errors.New("failed to unmarshal subscription"), err)
			}
		}
	}

	return &result, nil
}

func (pool *Pool) Subscribe(
	subscriptionType string,
	subscriptionVersion string,
	subscriptionCondition map[string]string,
	authorizerId string,
) (*Subscription, error) {
	if len(pool.Subscriptions) >= max_listeners_per_pool {
		return nil, ErrEventPoolFull
	}

	access_token, err := getAuthorizerToken(authorizerId)
	if err != nil {
		return nil, err
	}

	result, err := pool.request_subscription(subscriptionType, subscriptionVersion, subscriptionCondition, access_token)
	if err != nil {
		return nil, err
	}

	if len(result.Data) != 1 {
		return nil, errors.New("response had invalid data")
	}

	subscription := Subscription{
		Id:        result.Data[0].Id,
		Type:      result.Data[0].Type,
		Version:   result.Data[0].Version,
		Condition: result.Data[0].Condition,
	}

	pool.Subscriptions[subscription.Id] = &subscription

	return &subscription, nil
}

func (pool *Pool) Resubscribe(id string) error {
	subscription, exists := pool.Subscriptions[id]
	if !exists {
		return errors.New("pool resubscribed to subscription that doesn't exist")
	}

	record, err := pb.Dao().FindFirstRecordByFilter("twitch_event_subscriptions", "eventSubId = {:id}", dbx.Params{"id": id})
	if err != nil {
		return err
	}

	access_token, err := getAuthorizerToken(record.GetString("authorizer"))
	if err != nil {
		return err
	}

	newSubscription, err := pool.request_subscription(
		subscription.Type,
		subscription.Version,
		subscription.Condition,
		access_token,
	)
	if err != nil {
		return err
	}

	{
		_, err := pb.Dao().DB().
			Update(
				"twitch_event_subscriptions",
				dbx.Params{"eventSubId": newSubscription.Data[0].Id},
				dbx.NewExp("id = {:id}", dbx.Params{"id": record.Id}),
			).
			Execute()
		if err != nil {
			return err
		}
	}

	return nil
}

func SetPoolEventHook(fn PoolEventHookFunc) {
	if PoolEventHook != nil {
		println("WARNING - Setting the PoolEventHook multiple times does not add multiple hooks")
	}

	PoolEventHook = fn
}

func NewPool() (*Pool, error) {
	pool := Pool{
		Id:            security.RandomString(12),
		Status:        STARTING,
		Subscriptions: map[string]*Subscription{},
		Error:         nil,
	}

	err := pool.Connect(event_sub_url)
	if err != nil {
		return nil, err
	}

	Pools[pool.Id] = &pool

	return &pool, nil
}

func FindOrCreateAvailablePool() (*Pool, error) {
	var available_pool *Pool
	for _, pool := range Pools {
		if pool.IsAvailable() {
			available_pool = pool
			break
		}
	}

	if available_pool == nil {
		new_pool, err := NewPool()
		if err != nil {
			return nil, err
		}
		available_pool = new_pool
	}

	return available_pool, nil
}
