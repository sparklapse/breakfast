package events

import (
	"breakfast/services/events/twitch"
	"encoding/json"
	"errors"
	"net/url"
	"strings"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/tools/subscriptions"
)

func RegisterService(app *pocketbase.PocketBase) {
	twitch.RegisterService(app)

	app.OnRealtimeBeforeSubscribeRequest().Add(func(e *core.RealtimeSubscribeEvent) error {
		for _, subscription := range e.Subscriptions {
			if !strings.HasPrefix(subscription, "breakfast/events") {
				continue
			}

			_, optionsUrl, hasOptions := strings.Cut(subscription, "?options=")
			optionsString, err := url.QueryUnescape(optionsUrl)
			if err != nil {
				return errors.New("breakfast/events options was not a valid url encoded string")
			}

			var options subscriptions.SubscriptionOptions
			if hasOptions {
				err := json.Unmarshal([]byte(optionsString), &options)
				if err != nil {
					return errors.New("failed to unmarshal options")
				}
			}

			var user *models.Record
			if hasOptions && options.Query != nil {
				streamKey, valid := options.Query["sk"].(string)
				if !valid {
					return errors.New("an invalid stream key was provided")
				}
				records, err := app.Dao().FindRecordsByFilter(
					"users",
					"streamKey = {:streamKey}",
					"-created",
					1,
					0,
					dbx.Params{"streamKey": streamKey},
				)
				if err != nil || len(records) != 1 {
					return errors.Join(errors.New("failed to get user by streamKey"), err)
				}
				user = records[0]
			}

			if user == nil {
				info := apis.RequestInfo(e.HttpContext)
				user = info.AuthRecord
			}

			if user == nil {
				return errors.New("no user authenticated")
			}

			e.Client.Set(subscription+"-user", user.Id)
		}

		return nil
	})
}
