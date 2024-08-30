package www

import (
	"breakfast/www/admin"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

func RegisterService(app *pocketbase.PocketBase) {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		admin.RegisterBreakfastAdmin(e)
		return nil
	})
}
