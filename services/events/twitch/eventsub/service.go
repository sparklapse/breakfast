package eventsub

import (
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

var pb *pocketbase.PocketBase

func RegisterService(app *pocketbase.PocketBase) {
	pb = app

	RegisterAPIs(app)

	// Get all subscriptions and subscribe
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		var subscriptions []struct {
			Id string `db:"id"`
		}
		err := app.Dao().RecordQuery("twitch_event_subscriptions").All(&subscriptions)
		if err != nil {
			return err
		}

		for _, sub := range subscriptions {
			_, err := Subscribe(sub.Id)
			if err != nil {
				app.Logger().Error(
					"EVENTS Twitch event failed to subscribe on start up",
					"error", err.Error(),
				)
				app.Dao().DB().
					Delete(
						"twitch_event_subscriptions",
						dbx.NewExp("id = {:id}", dbx.Params{"id": sub.Id}),
					).
					Execute()
			}
		}

		return nil
	})

	// Create subscriptions in database for a user that links an account
	app.OnRecordAfterAuthWithOAuth2Request("users").Add(func(e *core.RecordAuthWithOAuth2Event) error {
		if e.ProviderName != "twitch" {
			return nil
		}

		CreateDefaultSubscriptionsForUser(e.Record.Id)

		return nil
	})

	// Remove subscriptions from database for a user that unlinks an account
	app.OnRecordBeforeUnlinkExternalAuthRequest("users").Add(func(e *core.RecordUnlinkExternalAuthEvent) error {
		if e.ExternalAuth.Provider != "twitch" {
			return nil
		}

		records, err := app.Dao().FindRecordsByFilter(
			"twitch_event_subscriptions",
			"authorizer = {:userId}",
			"-created",
			-1,
			0,
			dbx.Params{"userId": e.Record.Id},
		)
		if err != nil {
			return err
		}

		for _, record := range records {
			{
				err := Unsubscribe(record.Id)
				if err != nil {
					return err
				}
			}
			err := app.Dao().DeleteRecord(record)
			if err != nil {
				return err
			}
		}

		return nil
	})

	// Cleanup connections on termination
	app.OnTerminate().Add(func(e *core.TerminateEvent) error {
		_, err := app.Dao().DB().Update(
			"twitch_event_subscriptions",
			dbx.Params{"eventSubId": ""},
			dbx.NewExp("true"),
		).Execute()

		if err != nil {
			return err
		}

		for _, pool := range Pools {
			pool.Close()
		}

		return nil
	})
}
