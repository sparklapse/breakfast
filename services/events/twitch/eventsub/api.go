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
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

func RegisterAPIs(app *pocketbase.PocketBase) {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		// Subscription APIs
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

			err := CreateDefaultSubscriptionsForUser(user.Id)
			if err != nil {
				return c.JSON(500, map[string]string{"message": "Failed to subscribe user to defaults"})
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
			authorizerTwitchRecord, err := pb.Dao().FindExternalAuthByRecordAndProvider(user, "twitch")
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
			case subscriptions.TypeChannelChatMessage:
				config := subscriptions.CreateChannelChatMessageSubscription(id, authorizerTwitchRecord.ProviderId)
				err := CreateSubscription(user.Id, config)
				if err != nil {
					return c.JSON(500, map[string]string{"message": "Failed to create subscription", "error": err.Error()})
				}
			default:
				return c.JSON(400, map[string]string{"message": "Cant make a subscription of that type"})
			}

			return nil
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

			Unsubscribe(record.Id)
			{
				err := app.Dao().DeleteRecord(record)
				if err != nil {
					return c.JSON(500, map[string]string{"message": "Failed to delete record", "error": err.Error()})
				}
			}

			return c.JSON(200, map[string]string{"message": "OK"})
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
