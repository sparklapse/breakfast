package twitch

import (
	"breakfast/services/events/twitch/eventsub"

	"github.com/pocketbase/pocketbase"
)

func RegisterService(app *pocketbase.PocketBase) {
	eventsub.RegisterService(app)
}
