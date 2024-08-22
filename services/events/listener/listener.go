package listener

import (
	"breakfast/services/events/types"
	"encoding/json"
	"strings"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/subscriptions"
)

var pb *pocketbase.PocketBase
var SavedEventTypes []string

func SetupListener(app *pocketbase.PocketBase) {
	pb = app

	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		var query struct {
			Value string `db:"value"`
		}
		err := app.Dao().DB().
			Select("key", "value").
			From("_params").
			Where(dbx.NewExp("key = 'breakfast-events-saved-types'")).
			One(&query)
		if err != nil {
			panic("failed to load event saved types from db: " + err.Error())
		}

		SavedEventTypes = strings.Split(query.Value, ",")
		return nil
	})

}

func EmitEvent(event types.BreakfastEvent) {
	for _, client := range pb.SubscriptionsBroker().Clients() {
		if client.IsDiscarded() {
			continue
		}
		for sub := range client.Subscriptions() {
			if !strings.HasPrefix(sub, types.BreakfastEventsKey) {
				continue
			}

			data, err := json.Marshal(event)
			if err != nil {
				pb.Logger().Error(
					"EVENTS Failed to marshal event",
					"error", err.Error(),
					"event type", event.Type,
				)
			}

			client.Send(subscriptions.Message{
				Name: sub,
				Data: data,
			})
		}
	}
}
