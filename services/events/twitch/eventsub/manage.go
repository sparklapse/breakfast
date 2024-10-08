package eventsub

import (
	"breakfast/services"
	"breakfast/services/events/twitch/eventsub/connection"
	"breakfast/services/events/twitch/eventsub/subscriptions"

	"github.com/pocketbase/pocketbase/models"
)

func CreateSubscription(userId string, config subscriptions.SubscriptionConfig) (string, error) {
	collection, err := services.App.Dao().FindCollectionByNameOrId("twitch_event_subscriptions")
	if err != nil {
		return "", err
	}

	record := models.NewRecord(collection)
	record.RefreshId()
	record.Set("authorizer", userId)
	record.Set("config", config)

	{
		err := services.App.Dao().SaveRecord(record)
		if err != nil {
			return "", err
		}
	}

	{
		_, err := connection.Subscribe(record.Id, config, userId)
		if err != nil {
			return "", err
		}
	}

	return record.Id, nil
}

func DeleteSubscription(subscriptionId string) error {
	record, err := services.App.Dao().FindRecordById("twitch_event_subscriptions", subscriptionId)
	if err != nil {
		return err
	}

	{
		err := services.App.Dao().DeleteRecord(record)
		if err != nil {
			return err
		}
	}

	{
		// Dont worry too much about errors here since if this fails, then it's probably
		// already unsubscribed or something is fundamentally wrong with the state of things
		connection.Unsubscribe(subscriptionId)
	}

	return nil
}
