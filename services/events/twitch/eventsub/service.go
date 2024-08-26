package eventsub

import (
	"net/http"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

func RegisterService(app *pocketbase.PocketBase, eventHook func(message *EventSubMessage, subscription *Subscription)) {
	// Create handler to send messages to realtime clients
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		SetPoolEventHook(eventHook)

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

			_, err := Subscribe(
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
				CreateDefaultSubscriptions(token.ProviderId)...,
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
				_, err := Subscribe(
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
					CreateDefaultSubscriptions(e.OAuth2User.Id)...,
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

			_, err := UnsubscribeUser(e.Record.Id, token.AccessToken, settings.TwitchAuth.ClientId)
			if err != nil {
				return err
			}

			return nil
		}

		return nil
	})

	// Cleanup connections on termination
	app.OnTerminate().Add(func(e *core.TerminateEvent) error {
		for _, pool := range Pools {
			pool.Close()
		}

		return nil
	})

	// Status APIs
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
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

		e.Router.GET("/api/breakfast/events/twitch/eventsub/subscriptions", func(c echo.Context) error {
			info := apis.RequestInfo(c)
			user := info.AuthRecord

			if user == nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			if user.Collection().Id != "users" {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			subscriptions := []map[string]any{}
			for s := range Subscriptions {
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
