package twitch

import (
	"breakfast/services/events/twitch/eventsub"
	"breakfast/services/events/types"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/subscriptions"
)

func RegisterService(app *pocketbase.PocketBase) {
	// Create handler to send messages to realtime clients
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		eventsub.SetPoolEventHook(func(message *eventsub.EventSubMessage, subscription *eventsub.Subscription) {
			switch subscription.Type {
			case "channel.chat.message":
				message, err := PayloadToChatMessage(message.Payload)
				if err != nil {
					app.Logger().Error(
						"EVENTS Failed to conform twitch chat message to type",
						"error", err.Error(),
					)
					return
				}

				data, err := json.Marshal(types.BreakfastEvent{
					Type: "chat-message",
					Data: message,
				})
				if err != nil {
					app.Logger().Error(
						"EVENTS Failed to marshal twitch chat message",
						"error", err.Error(),
					)
					return
				}

				for _, client := range app.SubscriptionsBroker().Clients() {
					if client.IsDiscarded() {
						continue
					}
					for sub := range client.Subscriptions() {
						if !strings.HasPrefix(sub, types.BreakfastEventsKey) {
							continue
						}
						userId, valid := client.Get(sub + "-user").(string)
						if !valid {
							app.Logger().Error(
								"EVENTS Failed to get user ID for subscription",
								"subscription", sub,
							)
							continue
						}
						if userId != subscription.User {
							continue
						}

						client.Send(subscriptions.Message{
							Name: sub,
							Data: data,
						})
					}
				}
			default:
				println("unknown event type")
			}
		})

		return nil
	})

	// Get all twitch users and subscribe to their events
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		var tokens []struct {
			User        string `db:"user"`
			AccessToken string `db:"accessToken"`
			ProviderId  string `db:"providerId"`
		}

		err := app.Dao().DB().
			NewQuery(`
				SELECT tokens.user, tokens.accessToken, _externalAuths.providerId
				FROM tokens
				JOIN _externalAuths
				ON tokens.identity = _externalAuths.id WHERE tokens.provider = 'twitch'
			`).
			All(&tokens)
		if err != nil {
			return err
		}

		settings, err := app.Dao().FindSettings()
		if err != nil {
			return err
		}

		for _, token := range tokens {
			if token.AccessToken == "" || token.ProviderId == "" {
				app.Logger().Error(
					"EVENTS Startup tried to start an event subscription with invalid token data",
					"providerId", token.ProviderId,
				)
				continue
			}

			_, err := eventsub.Subscribe(
				token.User,
				func() (string, error) {
					var t struct {
						AccessToken string `db:"accessToken"`
					}
					err := app.Dao().DB().
						NewQuery("SELECT accessToken FROM tokens WHERE user = {:user}").
						Bind(dbx.Params{"user": token.User}).
						One(&t)
					if err != nil {
						return "", err
					}
					return t.AccessToken, nil
				},
				settings.TwitchAuth.ClientId,
				eventsub.CreateDefaultSubscriptions(token.ProviderId)...,
			)

			if err != nil {
				app.Logger().Error(
					"EVENTS Startup had problems when trying to create subscriptions for user",
					"error", err.Error(),
					"providerId", token.ProviderId,
				)
				continue
			}
		}

		return nil
	})

	// Create subscriptions for a user that links an account
	app.OnRecordAfterAuthWithOAuth2Request("users").Add(func(e *core.RecordAuthWithOAuth2Event) error {
		settings, err := app.Dao().FindSettings()
		if err != nil {
			return err
		}

		switch e.ProviderName {
		case "twitch":
			go func() {
				_, err := eventsub.Subscribe(
					e.Record.Id,
					func() (string, error) {
						var t struct {
							AccessToken string `db:"accessToken"`
						}
						err := app.Dao().DB().
							NewQuery("SELECT accessToken FROM tokens WHERE user = {:user}").
							Bind(dbx.Params{"user": e.Record.Id}).
							One(&t)
						if err != nil {
							return "", err
						}
						return t.AccessToken, nil
					},
					settings.TwitchAuth.ClientId,
					eventsub.CreateDefaultSubscriptions(e.OAuth2User.Id)...,
				)
				if err != nil {
					app.Logger().Error(
						"EVENTS Failed to subscribe user",
						"error", err.Error(),
						"username", e.Record.Username(),
					)
				}
			}()

			return nil
		}

		return nil
	})

	// Remove subscriptions for a user that unlinks an account
	app.OnRecordBeforeUnlinkExternalAuthRequest("users").Add(func(e *core.RecordUnlinkExternalAuthEvent) error {
		settings, err := app.Dao().FindSettings()
		if err != nil {
			return err
		}

		switch e.ExternalAuth.Provider {
		case "twitch":
			var token struct {
				AccessToken string `db:"accessToken"`
			}
			{
				err := app.Dao().DB().
					NewQuery("SELECT accessToken FROM tokens WHERE user = {:user}").
					Bind(dbx.Params{
						"user": e.Record.Id,
					}).
					One(&token)
				if err != nil {
					return err
				}
			}

			_, err := eventsub.UnsubscribeUser(e.Record.Id, token.AccessToken, settings.TwitchAuth.ClientId)
			if err != nil {
				return err
			}

			return nil
		}

		return nil
	})

	// Cleanup connections on termination
	app.OnTerminate().Add(func(e *core.TerminateEvent) error {
		for _, pool := range eventsub.Pools {
			pool.Close()
		}

		return nil
	})

	// Status APIs
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		e.Router.GET("/api/breakfast/events/twitch/pools", func(c echo.Context) error {
			status := map[string]any{}
			for key, pool := range eventsub.Pools {
				status[key] = map[string]any{
					"status":        pool.Status.String(),
					"subscriptions": len(pool.Subscriptions),
				}
			}

			return c.JSON(http.StatusOK, status)
		})

		e.Router.GET("/api/breakfast/events/twitch/subscriptions", func(c echo.Context) error {
			subscriptions := []map[string]any{}
			for s := range eventsub.Subscriptions {
				subscriptions = append(subscriptions, map[string]any{
					"id":        s.Id,
					"type":      s.Type,
					"condition": s.Condition,
				})
			}
			return c.JSON(http.StatusOK, map[string]any{"subscriptions": subscriptions})
		})

		return nil
	})
}
