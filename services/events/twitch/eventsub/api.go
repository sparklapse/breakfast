package eventsub

import (
	bapis "breakfast/services/apis"
	"breakfast/services/events/twitch/eventsub/subscriptions"
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
	"github.com/pocketbase/pocketbase/models"
)

func RegisterAPIs(app *pocketbase.PocketBase) {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		// Subscription APIs
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
			userTwitchRecord, err := app.Dao().FindExternalAuthByRecordAndProvider(user, "twitch")
			if err != nil {
				return c.JSON(403, map[string]string{"message": "User must have their twitch account connected to create subscriptions"})
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

			// Prep a new record for subscription creation
			collection, err := app.Dao().FindCollectionByNameOrId("twitch_event_subscriptions")
			record := models.NewRecord(collection)
			record.MarkAsNew()
			record.RefreshId()
			record.Set("authorizer", user.Id)

			// Configure the subscription type
			switch request.Type {
			case subscriptions.TypeChannelChatMessage:
				existing, err := app.Dao().FindFirstRecordByFilter(
					"twitch_event_subscriptions",
					"config.type = {:type} && config.conditions.broadcaster_user_id = {:broadcasterId}",
					dbx.Params{
						"type":          subscriptions.TypeChannelChatMessage,
						"broadcasterId": id,
					},
				)
				if existing != nil {
					return c.JSON(409, map[string]string{"message": "A subscription for that already exists"})
				}
				if err != nil && !errors.Is(err, sql.ErrNoRows) {
					return c.JSON(500, map[string]string{"message": "Failed to check for existing subscriptions", "error": err.Error()})
				}

				config := subscriptions.CreateChannelChatMessageSubscription(id, userTwitchRecord.ProviderId)
				record.Set("config", config)
			default:
				return c.JSON(400, map[string]string{"message": "Type is not yet supported"})
			}

			{
				err := app.Dao().SaveRecord(record)
				if err != nil {
					return c.JSON(500, map[string]string{"message": "Failed to save subscription record", "error": err.Error()})
				}
			}

			{
				_, err := Subscribe(record.Id)
				if err != nil {
					app.Dao().DeleteRecord(record)
					return c.JSON(500, map[string]string{"message": "Failed to create subscription", "error": err.Error()})
				}
			}

			return nil
		})

		// Status APIs
		e.Router.GET("/api/breakfast/events/twitch/eventsub/pools", func(c echo.Context) error {
			info := apis.RequestInfo(c)
			user := info.AuthRecord

			if user == nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			if user.Collection().Id != "users" {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			status := map[string]any{}
			for key, pool := range Pools {
				status[key] = map[string]any{
					"status":        pool.Status.String(),
					"subscriptions": len(pool.Subscriptions),
				}
			}

			return c.JSON(http.StatusOK, status)
		})

		return nil
	})
}
