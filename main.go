package main

import (
	_ "breakfast/migrations"
	"breakfast/services"
	"breakfast/services/account"
	"breakfast/services/apis"
	"breakfast/services/auth"
	"breakfast/services/events"
	"breakfast/services/overlays"
	"breakfast/services/pages"
	"breakfast/services/saas"
	"breakfast/services/viewers"
	"breakfast/www"
	"log"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/cmd"
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

	// Setup App Global
	services.RegisterApp(app)

	// Setup Services
	saas.RegisterService(app)
	auth.RegisterService(app)
	account.RegisterService(app)
	apis.RegisterService(app)
	viewers.RegisterService(app)
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

	serveCmd := cmd.NewServeCommand(app, true)
	err := app.Bootstrap()
	if err != nil {
		log.Fatal(err)
		panic("failed to bootstrap pocketbase")
	}
	if err := serveCmd.Execute(); err != nil {
		log.Fatal(err)
	}
	// if err := app.Start(); err != nil {
	// 	log.Fatal(err)
	// }
}
