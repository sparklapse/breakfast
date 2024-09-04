package events

import (
	"breakfast/services/events/listener"
	"breakfast/services/events/twitch"
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/cron"
	pbTypes "github.com/pocketbase/pocketbase/tools/types"
)

func purgeOldEvents(app *pocketbase.PocketBase) error {
	var query struct {
		Value string `db:"value"`
	}

	err := app.Dao().DB().
		Select("value").
		From("_params").
		Where(dbx.NewExp("key = 'breakfast-events-stored-duration")).
		One(&query)

	if err != nil {
		return err
	}

	duration, err := time.ParseDuration(query.Value)
	if err != nil {
		return err
	}

	{
		_, err := app.Dao().DB().
			Delete("events", dbx.NewExp(
				"created < :time",
				dbx.Params{
					"time": time.Now().Add(duration * -1).UTC().Format(pbTypes.DefaultDateLayout),
				}),
			).
			Execute()

		if err != nil {
			return err
		}
	}

	return nil
}

func purgeAllEvents(app *pocketbase.PocketBase) error {
	_, err := app.Dao().DB().
		Delete("events", dbx.NewExp("")).
		Execute()

	if err != nil {
		return err
	}

	return nil
}

func RegisterService(app *pocketbase.PocketBase) {
	listener.SetupListener(app)
	twitch.RegisterService(app)

	registerSettingsAPIs(app)
}

func RegisterJobs(app *pocketbase.PocketBase, scheduler *cron.Cron) {
	// Delete events older than store duration setting
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		scheduler.MustAdd("eventsCleanupOld", "0 0 * * *", func() {
			err := purgeOldEvents(app)
			if err != nil {
				app.Logger().Error("EVENTS Failed to purge old events", "error", err.Error())
			}
		})
		return nil
	})
}
