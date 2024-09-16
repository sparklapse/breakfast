package connection

import (
	"breakfast/app"
	"breakfast/services/events/twitch/eventsub/subscriptions"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/gorilla/websocket"
)

var ws *websocket.Conn
var eventHook EventHook
var sessionId string = ""
var shutdown bool = false

func SetEventHook(hook EventHook) {
	if eventHook != nil {
		panic("SetEventHook called multiple times")
	}

	eventHook = hook
}

func Reconnect() {
	if ws != nil {
		ws.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
		ws.Close()
		ws = nil
	}
}

func Disconnect() error {
	shutdown = true

	if ws == nil {
		return ErrNotConnected
	}

	err := ws.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
	if err != nil {
		return err
	}

	ws.Close()
	ws = nil

	app.App.Logger().Debug(
		"EVENTS Twitch eventsub disconnected",
	)

	return nil
}

func Connect(url string) error {
	shutdown = false
	socket, _, err := websocket.DefaultDialer.Dial(url, nil)
	if err != nil {
		return err
	}

	welcome := make(chan string)

	app.App.Logger().Debug(
		"EVENTS Twitch eventsub connected, starting welcome",
	)

	go func() {
		defer close(welcome)

		var keepalive *time.Timer
		var keepalive_duration time.Duration
		welcome_sent := false
		closed := false

		for {
			if closed {
				break
			}

			msgType, msgData, err := socket.ReadMessage()
			if err != nil {
				if !welcome_sent {
					welcome <- "error"
				}
				closed = true
				break
			}

			switch msgType {
			case websocket.CloseMessage:
				closed = true
				continue
			case websocket.BinaryMessage:
				fallthrough
			case websocket.TextMessage:
				// Continue
			default:
				println("Unhandled msgType: " + fmt.Sprint(msgType))
			}

			var message EventSubMessage
			{
				err := json.Unmarshal(msgData, &message)
				if err != nil {
					if !welcome_sent {
						welcome <- "error"
					}
					break
				}
			}

			switch message.Metadata.MessageType {
			case "session_welcome":
				if welcome_sent {
					continue
				}

				keepalive_timeout := message.Payload["session"].(map[string]any)["keepalive_timeout_seconds"].(float64)
				keepalive_duration = time.Second * time.Duration(keepalive_timeout+5) // We add a bit of extra buffer cause latency
				keepalive = time.NewTimer(keepalive_duration)

				// Reconnect if keepalive times out
				go func() {
					<-keepalive.C
					if closed {
						return
					}

					if len(activeSubscriptions) == 0 {
						Disconnect()
					} else {
						app.App.Logger().Error(
							"EVENTS Twitch eventsub timed out, reconnecting...",
						)
						Reconnect()
					}

					closed = true
				}()

				welcome <- message.Payload["session"].(map[string]any)["id"].(string)
				welcome_sent = true

				app.App.Logger().Debug(
					"EVENTS Twitch eventsub welcome received",
				)
			case "session_keepalive":
				keepalive.Reset(keepalive_duration)
			case "session_reconnect":
				closed = true

				reconnect_url := message.Payload["session"].(map[string]any)["reconnect_url"].(string)
				err := Connect(reconnect_url)
				if err != nil {
					app.App.Logger().Error(
						"EVENTS Twitch eventsub was requested to reconnect but failed",
						"error", err.Error(),
					)
					break
				}

				app.App.Logger().Debug(
					"EVENTS Twitch eventsub was requested to reconnect",
				)
				return
			case "revocation":
				// subscription_id := message.Payload["subscription"].(map[string]any)["id"].(string)

				// TODO: Revoke subscription
			case "notification":
				keepalive.Reset(keepalive_duration)
				if eventHook == nil {
					break
				}

				eventSub, ok := message.Payload["subscription"].(map[string]any)
				if !ok {
					app.App.Logger().Error(
						"EVENTS Twitch eventsub got a bad subscription from twitch",
					)
					break
				}
				subscription, err := SubscriptionFromPayload(eventSub)
				if err != nil {
					app.App.Logger().Error(
						"EVENTS Twitch eventsub failed to parse subscription",
						"error", err.Error(),
					)
					break
				}

				eventHook(&message, subscription)
			}
		}

		app.App.Logger().Debug(
			"EVENTS Twitch eventsub reader done reading",
		)

		if !shutdown {
			app.App.Logger().Info(
				"EVENTS Twitch eventsub reconnecting",
			)

			err := Connect(EventSubWsUrl)
			if err != nil {
				app.App.Logger().Error(
					"EVENTS Twitch eventsub failed to reconnect",
				)
				return
			}

			for id := range activeSubscriptions {
				record, err := app.App.Dao().FindRecordById("twitch_event_subscriptions", id)
				if err != nil {
					app.App.Logger().Error(
						"EVENTS Twitch eventsub failed to find active subscription",
						"error", err.Error(),
					)
					delete(activeSubscriptions, id)
					continue
				}

				var config subscriptions.SubscriptionConfig
				{
					err := record.UnmarshalJSONField("config", &config)
					if err != nil {
						app.App.Logger().Error(
							"EVENTS Twitch eventsub failed to unmarshal a config",
							"subscriptionId", record.Id,
							"error", err.Error(),
						)
						continue
					}
				}

				{
					_, err := Subscribe(id, config, record.GetString("authorizer"))
					if err != nil {
						app.App.Logger().Error(
							"EVENTS Twitch eventsub failed to resubscribe subscription",
							"error", err.Error(),
						)
					}
				}
			}
		}
	}()

	select {
	case id := <-welcome:
		if id == "error" {
			return errors.New("pool got disconnected before welcome message")
		}
		sessionId = id
		break
	case <-time.After(5 * time.Second):
		return errors.New("session id was never received")
	}

	if ws != nil {
		Reconnect()
	}

	ws = socket

	return nil
}
