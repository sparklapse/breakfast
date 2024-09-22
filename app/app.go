package app

import "github.com/pocketbase/pocketbase"

var App *pocketbase.PocketBase

func RegisterApp(app *pocketbase.PocketBase) {
	App = app
}
