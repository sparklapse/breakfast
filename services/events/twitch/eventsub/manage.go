package eventsub

import (
	"breakfast/app"
	"breakfast/services/events/twitch/eventsub/connection"
	"breakfast/services/events/twitch/eventsub/subscriptions"

	"github.com/pocketbase/pocketbase/models"
)

func CreateSubscription(userId string, config subscriptions.SubscriptionConfig) (string, error) {
	collection, err := app.App.Dao().FindCollectionByNameOrId("twitch_event_subscriptions")
	if err != nil {
		return "", err
	}

	record := models.NewRecord(collection)
	record.RefreshId()
	record.Set("authorizer", userId)
	record.Set("config", config)

	{
		err := app.App.Dao().SaveRecord(record)
		if err != nil {
			return "", err
		}
	}

	{
		_, err := connection.Subscribe(record.Id, config, userId)
		if err != nil {
			return "", nil
		}
	}

	return record.Id, nil
}

func DeleteSubscription(subscriptionId string) error {
	record, err := app.App.Dao().FindRecordById("twitch_event_subscriptions", subscriptionId)
	if err != nil {
		return err
	}

	{
		err := connection.Unsubscribe(subscriptionId)
		if err != nil {
			return err
		}
	}

	{
		err := app.App.Dao().DeleteRecord(record)
		if err != nil {
			return err
		}
	}

	return nil
}
