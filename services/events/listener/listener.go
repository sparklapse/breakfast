package listener

import (
	"breakfast/services/events/types"
	"encoding/json"
	"errors"
	"slices"
	"strings"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/tools/security"
	"github.com/pocketbase/pocketbase/tools/subscriptions"
)

var pb *pocketbase.PocketBase
var SavedEventTypes []string

var listeners map[string]func(event *types.BreakfastEvent)

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

func AddEventListener(id string, listener func(event *types.BreakfastEvent)) error {
	_, exists := listeners[id]
	if exists {
		return errors.New("a listener with that id already exists")
	}

	listeners[id] = listener

	return nil
}

func EmitEvent(provider string, providerId string, event types.BreakfastEvent) {
	eventId := security.RandomString(15)

	// Save event to database (if configured to)
	if slices.Contains(SavedEventTypes, event.Type) {
		event.Id = &eventId
		go func() {
			{
				exists, _ := pb.Dao().FindFirstRecordByFilter(
					"events",
					"providerId = {:providerId} && provider = {:provider}",
					dbx.Params{
						"providerId": providerId,
						"provider":   provider,
					},
				)

				if exists != nil {
					pb.Logger().Debug(
						"EVENTS Received an event that's already been processed. Skipping...",
						"provider", provider,
						"providerId", providerId,
					)
					return
				}
			}

			collection, err := pb.Dao().FindCollectionByNameOrId("events")
			if err != nil {
				pb.App.Logger().Error(
					"EVENTS Failed to get events collection",
					"error", err.Error(),
				)
				return
			}

			record := models.NewRecord(collection)
			record.SetId(eventId)
			record.Set("provider", provider)
			record.Set("providerId", providerId)
			record.Set("type", event.Type)
			record.Set("data", event.Data)

			{
				err := pb.Dao().Save(record)
				if err != nil {
					pb.App.Logger().Error(
						"EVENTS Failed to save event",
						"error", err.Error(),
					)
				}
			}
		}()
	}

	// Call registered listeners
	for _, listener := range listeners {
		go listener(&event)
	}

	// Send event to all clients
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
