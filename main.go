package main

import (
	_ "breakfast/migrations"
	"breakfast/services/account"
	"breakfast/services/auth"
	"breakfast/services/events"
	"breakfast/services/pages"
	"breakfast/services/saas"
	"breakfast/services/scenes"
	"breakfast/www"
	"log"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
	"github.com/pocketbase/pocketbase/tools/cron"
)

func main() {
	app := pocketbase.New()
	scheduler := cron.New()

	migratecmd.Register(app, app.RootCmd, migratecmd.Config{
		Dir: "migrations",
	})

	// Setup UI
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		www.RegisterBreakfastAdmin(e)
		return nil
	})

	// Setup Services
	saas.RegisterService(app)
	account.RegisterService(app)
	auth.RegisterService(app, scheduler)
	events.RegisterService(app)
	scenes.RegisterService(app)
	pages.RegisterService(app)

	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		scheduler.Start()

		return nil
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
