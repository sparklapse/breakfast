package main

import (
	_ "breakfast/migrations"
	"breakfast/services/account"
	"breakfast/services/auth"
	"breakfast/services/events"
	"breakfast/services/overlays"
	"breakfast/services/pages"
	"breakfast/services/saas"
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

	// Setup Services
	saas.RegisterService(app)
	auth.RegisterService(app)
	account.RegisterService(app)
	events.RegisterService(app)
	overlays.RegisterService(app)
	pages.RegisterService(app)
	www.RegisterService(app)

	// Setup jobs
	auth.RegisterJobs(app, scheduler)

	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		scheduler.Start()

		return nil
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
