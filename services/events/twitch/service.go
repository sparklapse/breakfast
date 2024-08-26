package twitch

import (
	"breakfast/services/events/listener"
	"breakfast/services/events/twitch/eventsub"
	"breakfast/services/events/types"

	"github.com/pocketbase/pocketbase"
)

func RegisterService(app *pocketbase.PocketBase) {
	eventsub.RegisterService(app, func(message *eventsub.EventSubMessage, subscription *eventsub.Subscription) {
		var eventType string
		var eventData any

		switch subscription.Type {
		case eventsub.SubscriptionTypeStreamOnline:
			data, err := eventsub.PayloadToStreamOnline(message.Payload)
			if err != nil {
				app.Logger().Error(
					"EVENTS Failed to conform twitch stream online to type",
					"error", err.Error(),
				)
				return
			}
			eventType = types.EventTypeStreamOnline
			eventData = data
		case eventsub.SubscriptionTypeStreamOffline:
			data, err := eventsub.PayloadToStreamOffline(message.Payload)
			if err != nil {
				app.Logger().Error(
					"EVENTS Failed to conform twitch stream offline to type",
					"error", err.Error(),
				)
				return
			}
			eventType = types.EventTypeStreamOffline
			eventData = data
		case eventsub.SubscriptionTypeChannelChatMessage:
			data, err := eventsub.PayloadToChatMessage(message.Payload)
			if err != nil {
				app.Logger().Error(
					"EVENTS Failed to conform twitch chat message to type",
					"error", err.Error(),
				)
				return
			}
			eventType = types.EventTypeChatMessage
			eventData = data
		default:
			app.Logger().Error(
				"EVENTS Twitch eventsub processed an event which isn't handled",
				"type", subscription.Type,
			)
			return
		}

		if eventData == nil || eventType == "" {
			app.Logger().Error(
				"EVENTS Twitch eventsub processed an event but didn't assign data",
				"type", eventType,
			)
			return
		}

		listener.EmitEvent(
			"twitch-eventsub",
			message.Metadata.MessageId,
			types.BreakfastEvent{
				Type: eventType,
				Data: eventData,
			},
		)
	})
}
