package twitch

import (
	"breakfast/services/events/listener"
	"breakfast/services/events/twitch/eventsub"
	"breakfast/services/events/twitch/eventsub/subscriptions"
	"breakfast/services/events/types"

	"github.com/pocketbase/pocketbase"
)

func RegisterService(app *pocketbase.PocketBase) {
	eventsub.RegisterService(app)
	eventsub.SetPoolEventHook(func(message *eventsub.EventSubMessage, subscription *eventsub.Subscription) {
		var eventType string
		var eventData any

		switch subscription.Type {
		case subscriptions.TypeStreamOnline:
			data, err := subscriptions.ProcessStreamOnlinePayload(message.Payload)
			if err != nil {
				app.Logger().Error(
					"EVENTS Failed to conform twitch stream online to type",
					"error", err.Error(),
				)
				return
			}
			eventType = types.EventTypeStreamOnline
			eventData = data
		case subscriptions.TypeStreamOffline:
			data, err := subscriptions.ProcessStreamOfflinePayload(message.Payload)
			if err != nil {
				app.Logger().Error(
					"EVENTS Failed to conform twitch stream offline to type",
					"error", err.Error(),
				)
				return
			}
			eventType = types.EventTypeStreamOffline
			eventData = data
		case subscriptions.TypeChannelChatMessage:
			data, err := subscriptions.ProcessChannelChatMessageEventPayload(message.Payload)
			if err != nil {
				app.Logger().Error(
					"EVENTS Failed to conform twitch chat message to type",
					"error", err.Error(),
				)
				return
			}
			eventType = types.EventTypeChatMessage
			eventData = data
		case subscriptions.TypeChannelSubscribe:
			data, err := subscriptions.ProcessChannelSubscribePayload(message.Payload)
			if err != nil {
				app.Logger().Error(
					"EVENTS Failed to conform twitch channel subscribe message to type",
					"error", err.Error(),
				)
				return
			}
			eventType = types.EventTypeSubscription
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
				Id:       nil,
				Type:     eventType,
				Platform: "twitch",
				Data:     eventData,
			},
		)
	})
}
