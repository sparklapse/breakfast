package eventsub

import (
	"errors"
	"net/http"
)

// Twitch's limit is 300 but we'll leave head room for potential weirdness
const max_listeners_per_pool = 200
const event_sub_url = "wss://eventsub.wss.twitch.tv/ws"
const subscriptions_url = "https://api.twitch.tv/helix/eventsub/subscriptions"

/*
Subscribe a user to some amount of subscriptions
*/
func Subscribe(
	user_id string,
	get_access_token AccessTokenGetter,
	client_id string,
	configs ...SubscriptionConfig,
) ([]*Subscription, error) {
	if len(configs) == 0 {
		return nil, errors.New("no subscriptions provided")
	}

	new_subscriptions := []*Subscription{}

	for _, config := range configs {
		pool, err := FindOrCreateAvailablePool()
		if err != nil {
			return nil, err
		}

		subscription, err := pool.Subscribe(
			config.Type,
			config.Version,
			config.Condition,
			user_id,
			client_id,
			get_access_token,
		)
		if err != nil {
			return nil, err
		}
		new_subscriptions = append(new_subscriptions, subscription)
	}

	return new_subscriptions, nil
}

/*
Unsubscribe a subscription by ID
*/
func Unsubscribe(
	subscription_id string,
	user_access_token string,
	client_id string,
) error {
	var subscription *Subscription
	var pool *Pool
	for s, p := range Subscriptions {
		if s.Id == subscription_id {
			subscription = s
			pool = p
			break
		}
	}

	if subscription == nil || pool == nil {
		return errors.New("could not find subscription and pool to unsubscribe to")
	}

	req, err := http.NewRequest("DELETE", subscriptions_url+"?id="+subscription.Id, nil)
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+user_access_token)
	req.Header.Set("Client-Id", client_id)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}

	if resp.StatusCode >= 400 {
		return errors.New("bad unsubscribe request: " + resp.Status)
	}

	delete(Subscriptions, subscription)
	delete(pool.Subscriptions, subscription.Id)

	if len(pool.Subscriptions) == 0 {
		err := pool.Close()
		if err != nil {
			return err
		}

		delete(Pools, pool.Id)
	}

	return nil
}

/*
Unsubscribe all subscriptions pertaining to a specific user
*/
func UnsubscribeUser(
	user_id string,
	user_access_token string,
	client_id string,
) (*int, error) {
	unsubscribed := 0
	for subscription := range Subscriptions {
		if subscription.User != user_id {
			continue
		}

		err := Unsubscribe(
			subscription.Id,
			user_access_token,
			client_id,
		)
		if err != nil {
			return nil, err
		}
		unsubscribed += 1
	}
	return &unsubscribed, nil
}
