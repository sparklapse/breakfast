package tokens

import (
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/cron"
)

func RegisterService(app *pocketbase.PocketBase, scheduler *cron.Cron) {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		RefreshExpiredTwitchTokens(app)
		ScheduleTwitchTokenRefresh(e, scheduler)
		return nil
	})

	app.OnRecordAfterAuthWithOAuth2Request("users").PreAdd(func(e *core.RecordAuthWithOAuth2Event) error {
		// Save tokens from auth provider to database
		return StoreTokenResponse(app, e)
	})
}
