package apis

import (
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

var pb *pocketbase.PocketBase

func RegisterService(app *pocketbase.PocketBase) {
	pb = app

	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		getTwitchSettings()
		return nil
	})
}
