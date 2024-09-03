package eventsub

import (
	"breakfast/services/events/twitch/eventsub/subscriptions"
	"errors"
	"net/http"

	"github.com/pocketbase/dbx"
)

// Twitch's limit is 300 but we'll leave head room for potential weirdness
const max_listeners_per_pool = 200
const event_sub_url = "wss://eventsub.wss.twitch.tv/ws"
const subscriptions_url = "https://api.twitch.tv/helix/eventsub/subscriptions"

func getAuthorizerToken(userId string) (string, error) {
	var query struct {
		AccessToken string `db:"accessToken"`
	}
	err := pb.Dao().DB().
		Select("accessToken").
		From("tokens").
		Where(dbx.NewExp("user = {:userId}", dbx.Params{"userId": userId})).
		One(&query)
	if err != nil {
		return "", err
	}

	return query.AccessToken, nil
}

/*
Subscribe a user to a subscription
*/
func Subscribe(
	subscriptionId string,
) (*Subscription, error) {
	record, err := pb.Dao().FindRecordById("twitch_event_subscriptions", subscriptionId)
	if err != nil {
		return nil, err
	}

	authorizerId := record.GetString("authorizer")
	if authorizerId == "" {
		return nil, errors.New("authorizer is nil")
	}

	var config subscriptions.SubscriptionConfig
	{
		err := record.UnmarshalJSONField("config", &config)
		if err != nil {
			return nil, err
		}
	}

	pool, err := FindOrCreateAvailablePool()
	if err != nil {
		return nil, err
	}

	subscription, err := pool.Subscribe(
		config.Type,
		config.Version,
		config.Condition,
		authorizerId,
	)
	if err != nil {
		return nil, err
	}

	{
		_, err := pb.Dao().DB().Update(
			"twitch_event_subscriptions",
			dbx.Params{
				"eventSubId": subscription.Id,
			},
			dbx.NewExp("id = {:id}", dbx.Params{"id": subscriptionId}),
		).Execute()
		if err != nil {
			return nil, err
		}
	}

	return subscription, nil
}

/*
Unsubscribe a subscription by ID
*/
func Unsubscribe(subscriptionId string) error {
	record, err := pb.Dao().FindRecordById("twitch_event_subscriptions", subscriptionId)
	if err != nil {
		return err
	}

	eventSubId := record.GetString("eventSubId")
	if eventSubId == "" {
		return errors.New("subscription is not subscribed")
	}

	accessToken, err := getAuthorizerToken(record.GetString("authorizer"))
	clientId := pb.Settings().TwitchAuth.ClientId

	var subscription *Subscription
	var pool *Pool
	for _, p := range Pools {
		for _, s := range p.Subscriptions {
			if s.Id == record.GetString("eventSubId") {
				subscription = s
				pool = p
				break
			}
		}
	}

	if subscription == nil || pool == nil {
		return errors.New("could not find subscription and pool to unsubscribe to")
	}

	req, err := http.NewRequest("DELETE", subscriptions_url+"?id="+subscription.Id, nil)
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Client-Id", clientId)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}

	if resp.StatusCode >= 400 {
		return errors.New("bad unsubscribe request: " + resp.Status)
	}

	delete(pool.Subscriptions, subscription.Id)

	if len(pool.Subscriptions) == 0 {
		err := pool.Close()
		if err != nil {
			return err
		}

		delete(Pools, pool.Id)
	}

	{
		_, err := pb.Dao().DB().Update(
			"twitch_event_subscriptions",
			dbx.Params{
				"eventSubId": "",
			},
			dbx.NewExp("id = {:id}", dbx.Params{"id": subscriptionId}),
		).Execute()
		if err != nil {
			return err
		}
	}

	return nil
}
