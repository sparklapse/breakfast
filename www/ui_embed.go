//go:build embed

package ui

import (
	"embed"

	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

//go:embed all:build
var distDir embed.FS
var distDirFs = echo.MustSubFS(distDir, "build")

func RegisterBreakfastUI(e *core.ServeEvent) {
	e.Router.GET("/breakfast", apis.StaticDirectoryHandler(distDirFs, true), middleware.Gzip())
	e.Router.GET("/breakfast/*", apis.StaticDirectoryHandler(distDirFs, true), middleware.Gzip())
}
