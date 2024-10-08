//go:build !embed

package admin

import (
	"os"

	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

func RegisterBreakfastAdmin(e *core.ServeEvent) {
	println("Using local files in ./www/build, use `-tags embed` for an embedded build")
	e.Router.GET("/breakfast", apis.StaticDirectoryHandler(os.DirFS("./www/admin/build"), true))
	e.Router.GET("/breakfast/*", apis.StaticDirectoryHandler(os.DirFS("./www/admin/build"), true))
}
