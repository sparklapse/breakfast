package auth

import (
	"breakfast/services/auth/tokens"
	"crypto/subtle"
	"errors"
	"strings"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/cron"
)

func RegisterService(app *pocketbase.PocketBase) {
	app.OnBeforeServe().PreAdd(func(e *core.ServeEvent) error {
		// Refresh any existing tokens before anything else
		tokens.RefreshExpiredTwitchTokens(app)

        // Enable authentication with streamKeys
		e.Router.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
			return func(c echo.Context) error {
				streamkey := c.Request().URL.Query().Get("sk")
				if streamkey == "" {
					return next(c)
				}

				parts := strings.SplitN(streamkey, ".", 2)

				if len(parts) != 2 {
					return next(c)
				}

				record, err := app.Dao().FindRecordById("users", parts[0])
				if err == nil && record != nil {
					if subtle.ConstantTimeCompare([]byte(parts[1]), []byte(record.GetString("streamKey"))) == 1 {
						c.Set(apis.ContextAuthRecordKey, record)
					}
				}

				return next(c)
			}
		})

		return nil
	})

	// Don't create accounts with OAuth
	app.OnRecordBeforeAuthWithOAuth2Request("users").PreAdd(func(e *core.RecordAuthWithOAuth2Event) error {
		if e.IsNewRecord {
			return errors.New("unauthorized")
		}
		return nil
	})

	app.OnRecordAfterAuthWithOAuth2Request("users").PreAdd(func(e *core.RecordAuthWithOAuth2Event) error {
		// Save tokens from auth provider to database
		return tokens.StoreTokenResponse(app, e)
	})
}

func RegisterJobs(app *pocketbase.PocketBase, scheduler *cron.Cron) {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		tokens.ScheduleTwitchTokenRefresh(app, scheduler)
		return nil
	})
}
