package auth

import (
	"breakfast/services/auth/tokens"
	"errors"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/cron"
)

func RegisterService(app *pocketbase.PocketBase, scheduler *cron.Cron) {
	tokens.RegisterService(app, scheduler)

	// Don't create accounts with OAuth
	app.OnRecordBeforeAuthWithOAuth2Request("users").PreAdd(func(e *core.RecordAuthWithOAuth2Event) error {
		if e.IsNewRecord {
			return errors.New("unauthorized")
		}
		return nil
	})

	// Don't allow listing auth providers if not singed in
	app.OnRecordListExternalAuthsRequest("users").Add(func(e *core.RecordListExternalAuthsEvent) error {
		info := apis.RequestInfo(e.HttpContext)
		if info.AuthRecord == nil && info.Admin == nil {
			return errors.New("unauthorized")
		}
		return nil
	})
}
