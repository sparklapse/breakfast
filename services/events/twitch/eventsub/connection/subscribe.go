package connection

import (
	"breakfast/app"
	"breakfast/services/events/twitch/eventsub/subscriptions"
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"github.com/pocketbase/dbx"
)

var activeSubscriptions map[string]*Subscription = make(map[string]*Subscription)

func requestSubscription(subType string, subVersion string, subCondition map[string]string, accessToken string) (*SubscriptionResponse, error) {
	if ws == nil || sessionId == "" {
		err := Connect(EventSubWsUrl)
		if err != nil {
			return nil, errors.Join(errors.New("socket not connected and failed to connect"), err)
		}
	}

	clientId := app.App.Settings().TwitchAuth.ClientId
	subRequest := SubscriptionRequest{
		Type:      subType,
		Version:   subVersion,
		Condition: subCondition,
		Transport: WebsocketTransport(sessionId),
	}

	body, err := json.Marshal(subRequest)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", SubscriptionsUrl, bytes.NewReader(body))
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

func getAuthorizerToken(userId string) (string, error) {
	var query struct {
		AccessToken string `db:"accessToken"`
	}
	err := app.App.Dao().DB().
		Select("accessToken").
		From("tokens").
		Where(dbx.NewExp("user = {:userId}", dbx.Params{"userId": userId})).
		One(&query)
	if err != nil {
		return "", err
	}

	return query.AccessToken, nil
}

func Subscribe(id string, sub subscriptions.SubscriptionConfig, authorizerId string) (*Subscription, error) {
	token, err := getAuthorizerToken(authorizerId)
	if err != nil {
		return nil, err
	}

	resp, err := requestSubscription(
		sub.Type,
		sub.Version,
		sub.Condition,
		token,
	)
	if err != nil {
		return nil, err
	}

	if len(resp.Data) != 1 {
		return nil, errors.New("subscription subscribed but returned no data")
	}

	subscription := Subscription{
		Id:        resp.Data[0].Id,
		Type:      resp.Data[0].Type,
		Version:   resp.Data[0].Version,
		Condition: resp.Data[0].Condition,
	}

	activeSubscriptions[id] = &subscription

	return &subscription, nil
}

func Unsubscribe(id string) error {
	subscription, exists := activeSubscriptions[id]
	if !exists {
		return errors.New("subscription doesn't exist or isn't subscribed")
	}

	record, err := app.App.Dao().FindRecordById("twitch_event_subscriptions", id)
	if err != nil {
		return err
	}

	token, err := getAuthorizerToken(record.GetString("authorizer"))
	if err != nil {
		return err
	}

	clientId := app.App.Settings().TwitchAuth.ClientId

	req, err := http.NewRequest("DELETE", SubscriptionsUrl+"?id="+subscription.Id, nil)
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Client-Id", clientId)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}

	if resp.StatusCode >= 400 {
		return errors.New("bad unsubscribe request: " + resp.Status)
	}

	delete(activeSubscriptions, subscription.Id)

	return nil
}
