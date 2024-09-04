package eventsub

import (
	"breakfast/services/events/twitch/eventsub/subscriptions"
	"database/sql"
	"errors"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/models"
)

var ErrSubscriptionExists = errors.New("a subscription with that config already exists")

func CreateSubscription(authorizerId string, config subscriptions.SubscriptionConfig) error {
	user, err := pb.Dao().FindRecordById("users", authorizerId)
	if err != nil {
		return err
	}

	// Prep a new record for subscription creation
	collection, err := pb.Dao().FindCollectionByNameOrId("twitch_event_subscriptions")
	record := models.NewRecord(collection)
	record.MarkAsNew()
	record.RefreshId()
	record.Set("authorizer", user.Id)
	record.Set("config", config)

	// Check for existing subscriptions
	switch config.Type {
	case subscriptions.TypeChannelSubscribe:
		fallthrough
	case subscriptions.TypeChannelChatMessage:
		existing, err := pb.Dao().FindFirstRecordByFilter(
			"twitch_event_subscriptions",
			"config.type = {:type} && config.condition.broadcaster_user_id = {:broadcaster_user_id}",
			dbx.Params{
				"type":                config.Type,
				"broadcaster_user_id": config.Condition["broadcaster_user_id"],
			},
		)
		if existing != nil {
			return ErrSubscriptionExists
		}
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			return err
		}
	default:
		return errors.New("subscription type existing check not implemented")
	}

	{
		err := pb.Dao().SaveRecord(record)
		if err != nil {
			return err
		}
	}

	{
		_, err := Subscribe(record.Id)
		if err != nil {
			return err
		}
	}
	return nil
}

func CreateDefaultSubscriptionsForUser(userId string) error {
	user, err := pb.Dao().FindRecordById("users", userId)
	if err != nil {
		return err
	}

	twitch, err := pb.Dao().FindExternalAuthByRecordAndProvider(user, "twitch")
	if err != nil {
		return err
	}

	maybeErr := []error{}
	for _, subscription := range subscriptions.CreateDefaultSubscriptions(twitch.ProviderId) {
		err := CreateSubscription(user.Id, subscription)
		if err != nil {
			maybeErr = append(maybeErr, err)
		}
		// collection, err := pb.Dao().FindCollectionByNameOrId("twitch_event_subscriptions")
		// if err != nil {
		// 	return err
		// }

		// record := models.NewRecord(collection)
		// record.MarkAsNew()
		// record.RefreshId()
		// record.Set("config", subscription)
		// record.Set("authorizer", user.Id)

		// {
		// 	err := pb.Dao().Save(record)
		// 	if err != nil {
		// 		return err
		// 	}
		// }
		// {
		// 	_, err := Subscribe(record.Id)
		// 	if err != nil {
		// 		return err
		// 	}
		// }
	}

	if errors.Join(maybeErr...) != nil {
		return err
	}

	return nil
}
