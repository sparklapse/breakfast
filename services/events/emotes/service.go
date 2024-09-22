package emotes

import (
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/cron"
)

func RegisterService(app *pocketbase.PocketBase) {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		RefreshSTVGlobalEmotes()
		GetAllSTVEmotesForTwitch()

		return nil
	})
}

func RegisterJobs(app *pocketbase.PocketBase, scheduler *cron.Cron) {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		ScheduleSTVEmoteRefresh(app, scheduler)

		return nil
	})
}
