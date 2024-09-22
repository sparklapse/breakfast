package auth

import (
	"breakfast/services/auth/tokens"
	"errors"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/cron"
)

func RegisterService(app *pocketbase.PocketBase) {
	// Refresh any existing tokens before anything else
	app.OnBeforeServe().PreAdd(func(e *core.ServeEvent) error {
		tokens.RefreshExpiredTwitchTokens(app)
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
