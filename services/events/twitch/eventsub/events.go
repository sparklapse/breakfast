package eventsub

import (
	"breakfast/services/events/twitch/eventsub/subscriptions"
	"errors"
	"net/http"
	"strings"

	"github.com/pocketbase/dbx"
)

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

func setSubscriptionErrored(subscriptionId string, err string) {
	pb.Dao().DB().Update(
		"twitch_event_subscriptions",
		dbx.Params{"eventSubId": "error: " + err},
		dbx.NewExp("id = {:id}", dbx.Params{"id": subscriptionId}),
	)
}

var ErrNotSubscribed = errors.New("not subscribed")

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
		setSubscriptionErrored(subscriptionId, "authorizer is nil")
		return nil, errors.New("authorizer is nil")
	}

	alreadySubscribed := record.GetString("eventSubId")
	if alreadySubscribed != "" && !strings.HasPrefix(alreadySubscribed, "error:") {
		Unsubscribe(subscriptionId)
	}

	var config subscriptions.SubscriptionConfig
	{
		err := record.UnmarshalJSONField("config", &config)
		if err != nil {
			setSubscriptionErrored(subscriptionId, err.Error())
			return nil, err
		}
	}

	pool, err := FindOrCreateAvailablePool()
	if err != nil {
		setSubscriptionErrored(subscriptionId, err.Error())
		return nil, err
	}

	subscription, err := pool.Subscribe(
		config.Type,
		config.Version,
		config.Condition,
		authorizerId,
	)
	if err != nil {
		setSubscriptionErrored(subscriptionId, err.Error())
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
			setSubscriptionErrored(subscriptionId, err.Error())
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
		setSubscriptionErrored(subscriptionId, err.Error())
		return err
	}

	eventSubId := record.GetString("eventSubId")
	if eventSubId == "" || strings.HasPrefix(eventSubId, "error:") {
		return ErrNotSubscribed
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
