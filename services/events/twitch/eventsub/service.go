package eventsub

import (
	"breakfast/services/events/listener"
	"breakfast/services/events/twitch/eventsub/connection"
	"breakfast/services/events/twitch/eventsub/subscriptions"
	"breakfast/services/events/types"
	"encoding/json"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

func RegisterService(app *pocketbase.PocketBase) {
	connection.SetEventHook(func(message *connection.EventSubMessage, subscription *connection.Subscription) {
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
		case subscriptions.TypeChannelChatMessageDelete:
			data, err := subscriptions.ProcessChannelChatMessageDeletePayload(message.Payload)
			if err != nil {
				app.Logger().Error(
					"EVENTS Failed to conform twitch channel message delete to type",
					"error", err.Error(),
				)
			}
			eventType = types.EventTypeChatMessageDelete
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

	// Subscribe stored subscriptions
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		var query []struct {
			Id         string `db:"id"`
			Authorizer string `db:"authorizer"`
			Config     []byte `db:"config"`
		}

		{
			err := app.Dao().DB().
				Select("id", "authorizer", "config").
				From("twitch_event_subscriptions").
				All(&query)
			if err != nil {
				return err
			}
		}

		if len(query) == 0 {
			return nil
		}

		err := connection.Connect(connection.EventSubWsUrl)
		if err != nil {
			return err
		}

		// Setup in a goroutine to not block the web server startup
		go func() {
			for _, row := range query {
				var config subscriptions.SubscriptionConfig
				{
					err := json.Unmarshal(row.Config, &config)
					if err != nil {
						app.Logger().Error(
							"EVENTS Twitch eventsub loaded with an invalid config",
							"subscription", row.Id,
							"error", err.Error(),
						)
					}
				}

				{
					_, err := connection.Subscribe(
						row.Id,
						config,
						row.Authorizer,
					)
					if err != nil {
						app.Logger().Error(
							"EVENTS Twitch eventsub loaded subscription but failed to subscribe",
							"subscription", row.Id,
							"error", err.Error(),
						)
					}
				}
			}
		}()

		return nil
	})

	// Setup APIs to manage subscriptions
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		// e.Router.POST("/api/breakfast/events/twitch/eventsub/resubscribe-defaults", func(c echo.Context) error {
		// 	// Validate user is authenticated
		// 	info := apis.RequestInfo(c)
		// 	user := info.AuthRecord

		// 	if user == nil {
		// 		return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
		// 	}

		// 	if user.Collection().Id != "users" {
		// 		return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
		// 	}

		// 	err := CreateDefaultSubscriptionsForUser(user.Id)
		// 	if err != nil {
		// 		return c.JSON(500, map[string]string{"message": "Failed to subscribe user to defaults"})
		// 	}

		// 	return c.JSON(200, map[string]string{"message": "OK"})
		// })

		// e.Router.POST("/api/breakfast/events/twitch/eventsub/subscribe", func(c echo.Context) error {
		// 	// Validate user is authenticated
		// 	info := apis.RequestInfo(c)
		// 	user := info.AuthRecord

		// 	if user == nil {
		// 		return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
		// 	}

		// 	if user.Collection().Id != "users" {
		// 		return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
		// 	}

		// 	// Get user linked twitch account
		// 	authorizerTwitchRecord, err := pb.Dao().FindExternalAuthByRecordAndProvider(user, "twitch")
		// 	if err != nil {
		// 		return c.JSON(400, map[string]string{"message": "User does not have twitch linked"})
		// 	}

		// 	// Get request body
		// 	body, err := io.ReadAll(c.Request().Body)
		// 	if err != nil {
		// 		return c.JSON(500, map[string]string{"message": "Failed to read body", "error": err.Error()})
		// 	}

		// 	var request struct {
		// 		Type string         `json:"type"`
		// 		Data map[string]any `json:"data"`
		// 	}
		// 	{
		// 		err := json.Unmarshal(body, &request)
		// 		if err != nil {
		// 			return c.JSON(400, map[string]string{"message": "Failed to unmarshal body", "error": err.Error()})
		// 		}
		// 	}

		// 	// Get broadcaster from request
		// 	broadcasterId, idOk := request.Data["broadcasterId"].(string)
		// 	broadcasterLogin, loginOk := request.Data["broadcasterLogin"].(string)

		// 	if !idOk && !loginOk {
		// 		return c.JSON(400, map[string]string{"message": "No valid broadcaster id or login to use"})
		// 	}

		// 	var id string
		// 	if idOk {
		// 		id = broadcasterId
		// 	} else {
		// 		user, err := bapis.GetTwitchUserByLogin(broadcasterLogin)
		// 		if err != nil {
		// 			return c.JSON(500, map[string]string{"message": "Failed to find user with provided login", "error": err.Error()})
		// 		}

		// 		id = user.Id
		// 	}

		// 	if id == "" {
		// 		return c.JSON(400, map[string]string{"message": "Broadcaster cannot be empty"})
		// 	}

		// 	switch request.Type {
		// 	case "chat":
		// 		errs := []error{}
		// 		{
		// 			config := subscriptions.CreateChannelChatMessageSubscription(id, authorizerTwitchRecord.ProviderId)
		// 			errs = append(errs, CreateSubscription(user.Id, config))
		// 		}

		// 		{
		// 			config := subscriptions.CreateChannelChatMessageDeleteSubscription(id, authorizerTwitchRecord.ProviderId)
		// 			errs = append(errs, CreateSubscription(user.Id, config))
		// 		}

		// 		err := errors.Join(errs...)
		// 		if err != nil {
		// 			return c.JSON(500, map[string]string{"message": "Failed to create subscriptions for chat", "error": err.Error()})
		// 		}
		// 	case subscriptions.TypeChannelChatMessage:
		// 		config := subscriptions.CreateChannelChatMessageSubscription(id, authorizerTwitchRecord.ProviderId)
		// 		err := CreateSubscription(user.Id, config)
		// 		if err != nil {
		// 			return c.JSON(500, map[string]string{"message": "Failed to create subscription", "error": err.Error()})
		// 		}
		// 	default:
		// 		return c.JSON(400, map[string]string{"message": "Cant make a subscription of that type"})
		// 	}

		// 	return c.JSON(200, map[string]string{"message": "OK"})
		// })

		// e.Router.POST("/api/breakfast/events/twitch/eventsub/unsubscribe/:id", func(c echo.Context) error {
		// 	// Validate user is authenticated
		// 	info := apis.RequestInfo(c)
		// 	user := info.AuthRecord

		// 	if user == nil {
		// 		return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
		// 	}

		// 	if user.Collection().Id != "users" {
		// 		return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
		// 	}

		// 	subscriptionId := c.PathParam("id")
		// 	record, err := app.Dao().FindRecordById("twitch_event_subscriptions", subscriptionId)

		// 	if errors.Is(err, sql.ErrNoRows) {
		// 		return c.JSON(404, map[string]string{"message": "Subscription not found"})
		// 	}

		// 	if err != nil {
		// 		return c.JSON(500, map[string]string{"message": "Failed to query for subscription", "error": err.Error()})
		// 	}

		// 	Unsubscribe(record.Id)
		// 	{
		// 		err := app.Dao().DeleteRecord(record)
		// 		if err != nil {
		// 			return c.JSON(500, map[string]string{"message": "Failed to delete record", "error": err.Error()})
		// 		}
		// 	}

		// 	return c.JSON(200, map[string]string{"message": "OK"})
		// })

		return nil
	})

	app.OnTerminate().Add(func(e *core.TerminateEvent) error {
		connection.Disconnect()

		return nil
	})
}
