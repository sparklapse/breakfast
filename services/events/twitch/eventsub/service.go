package eventsub

import (
	bapis "breakfast/services/apis"
	"breakfast/services/events/listener"
	"breakfast/services/events/twitch/eventsub/connection"
	"breakfast/services/events/twitch/eventsub/subscriptions"
	"breakfast/services/events/types"
	"database/sql"
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
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
		case subscriptions.TypeChannelPointsRedeemAdd:
			data, err := subscriptions.ProcessChannelPointsRedeemAddPayload(message.Payload)
			if err != nil {
				app.Logger().Error(
					"EVENTS Failed to conform twitch channel points redeem add to type",
					"error", err.Error(),
				)
			}
			eventType = types.EventTypeCurrencySpent
			eventData = data
			if data.Viewer != nil {
				currentCount, exists := data.Viewer.Wallet["channel points"]
				if !exists {
					currentCount = 0
				}

				_, err := app.Dao().DB().
					NewQuery(
						"UPDATE viewers SET wallet = json_patch(wallet, json_object('channel points', {:amount})) WHERE id = {:id}",
					).
					Bind(dbx.Params{
						"amount": currentCount - data.Redeemed.Cost,
						"id":     data.Viewer.Id,
					}).
					Execute()

				if err != nil {
					app.Logger().Error(
						"EVENTS Twitch channel points were redeemed but unable to update viewer count",
						"error", err.Error(),
					)
				}
			}
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
		e.Router.POST("/api/breakfast/events/twitch/eventsub/resubscribe-defaults", func(c echo.Context) error {
			// Validate user is authenticated
			info := apis.RequestInfo(c)
			user := info.AuthRecord

			if user == nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			if user.Collection().Id != "users" {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			external, err := app.Dao().FindExternalAuthByRecordAndProvider(user, "twitch")
			if err != nil {
				return c.JSON(500, map[string]string{"message": "Failed to get twitch record for user"})
			}

			subs := subscriptions.CreateDefaultSubscriptions(external.ProviderId)
			for _, sub := range subs {
				recordId, err := CreateSubscription(user.Id, sub)
				if errors.Is(err, connection.ErrAlreadSubscribed) {
					record, _ := app.Dao().FindRecordById("twitch_event_subscriptions", recordId)
					if record != nil {
						app.Dao().DeleteRecord(record)
					}
					continue
				}

				if err != nil {
					app.Logger().Error(
						"EVENTS Twitch eventsub failed to subscribe",
						"error", err.Error(),
					)

					return c.JSON(500, map[string]string{"message": "Failed to subscribe"})
				}
			}

			return c.JSON(200, map[string]string{"message": "OK"})
		})

		e.Router.POST("/api/breakfast/events/twitch/eventsub/subscribe", func(c echo.Context) error {
			// Validate user is authenticated
			info := apis.RequestInfo(c)
			user := info.AuthRecord

			if user == nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			if user.Collection().Id != "users" {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			// Get user linked twitch account
			authorizerTwitchRecord, err := app.Dao().FindExternalAuthByRecordAndProvider(user, "twitch")
			if err != nil {
				return c.JSON(400, map[string]string{"message": "User does not have twitch linked"})
			}

			// Get request body
			body, err := io.ReadAll(c.Request().Body)
			if err != nil {
				return c.JSON(500, map[string]string{"message": "Failed to read body", "error": err.Error()})
			}

			var request struct {
				Type string         `json:"type"`
				Data map[string]any `json:"data"`
			}
			{
				err := json.Unmarshal(body, &request)
				if err != nil {
					return c.JSON(400, map[string]string{"message": "Failed to unmarshal body", "error": err.Error()})
				}
			}

			// Get broadcaster from request
			broadcasterId, idOk := request.Data["broadcasterId"].(string)
			broadcasterLogin, loginOk := request.Data["broadcasterLogin"].(string)

			if !idOk && !loginOk {
				return c.JSON(400, map[string]string{"message": "No valid broadcaster id or login to use"})
			}

			var id string
			if idOk {
				id = broadcasterId
			} else {
				user, err := bapis.GetTwitchUserByLogin(broadcasterLogin)
				if err != nil {
					return c.JSON(500, map[string]string{"message": "Failed to find user with provided login", "error": err.Error()})
				}

				id = user.Id
			}

			if id == "" {
				return c.JSON(400, map[string]string{"message": "Broadcaster cannot be empty"})
			}

			switch request.Type {
			case "chat":
				errs := []error{}
				{
					config := subscriptions.CreateChannelChatMessageSubscription(id, authorizerTwitchRecord.ProviderId)
					_, err := CreateSubscription(user.Id, config)
					errs = append(errs, err)
				}

				{
					config := subscriptions.CreateChannelChatMessageDeleteSubscription(id, authorizerTwitchRecord.ProviderId)
					_, err := CreateSubscription(user.Id, config)
					errs = append(errs, err)
				}

				err := errors.Join(errs...)
				if err != nil {
					return c.JSON(500, map[string]string{"message": "Failed to create subscriptions for chat", "error": err.Error()})
				}
			case "live":
				errs := []error{}
				{
					config := subscriptions.CreateStreamOnlineSubscription(id)
					_, err := CreateSubscription(user.Id, config)
					errs = append(errs, err)
				}

				{
					config := subscriptions.CreateStreamOfflineSubscription(id)
					_, err := CreateSubscription(user.Id, config)
					errs = append(errs, err)
				}

				err := errors.Join(errs...)
				if err != nil {
					return c.JSON(500, map[string]string{"message": "Failed to create subscriptions for live", "error": err.Error()})
				}
			default:
				return c.JSON(400, map[string]string{"message": "Cant make a subscription of that type"})
			}

			return c.JSON(200, map[string]string{"message": "OK"})
		})

		e.Router.POST("/api/breakfast/events/twitch/eventsub/unsubscribe/:id", func(c echo.Context) error {
			// Validate user is authenticated
			info := apis.RequestInfo(c)
			user := info.AuthRecord

			if user == nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			if user.Collection().Id != "users" {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			subscriptionId := c.PathParam("id")
			record, err := app.Dao().FindRecordById("twitch_event_subscriptions", subscriptionId)

			if errors.Is(err, sql.ErrNoRows) {
				return c.JSON(404, map[string]string{"message": "Subscription not found"})
			}

			if err != nil {
				return c.JSON(500, map[string]string{"message": "Failed to query for subscription", "error": err.Error()})
			}

			{
				err := DeleteSubscription(record.Id)
				if err != nil {
					return c.JSON(500, map[string]string{"message": "Failed to delete subscription", "error": err.Error()})
				}
			}

			return c.JSON(200, map[string]string{"message": "OK"})
		})

		return nil
	})

	// Subscribe to default twitch subscriptions
	app.OnRecordAfterAuthWithOAuth2Request("users").Add(func(e *core.RecordAuthWithOAuth2Event) error {
		if e.ProviderName != "twitch" {
			return nil
		}

		for _, sub := range subscriptions.CreateDefaultSubscriptions(e.OAuth2User.Id) {
			CreateSubscription(e.Record.Id, sub)
		}

		return nil
	})

	// Unsubscribe all events authorized by user
	app.OnRecordBeforeUnlinkExternalAuthRequest("users").Add(func(e *core.RecordUnlinkExternalAuthEvent) error {
		records, err := app.Dao().FindRecordsByFilter(
			"twitch_event_subscriptions",
			"authorizer = {:userId}",
			"-created",
			-1,
			0,
			dbx.Params{"userId": e.Record.Id},
		)

		if errors.Is(err, sql.ErrNoRows) {
			return nil
		}

		if err != nil {
			return err
		}

		for _, record := range records {
			err := DeleteSubscription(record.Id)
			if err != nil {
				app.Logger().Error(
					"EVENTS Failed to delete twitch eventsub subscription",
					"error", err.Error(),
					"subscription", record.Id,
				)
			}
		}

		return nil
	})

	app.OnTerminate().Add(func(e *core.TerminateEvent) error {
		connection.Disconnect()

		return nil
	})
}
