package pages

import (
	"breakfast/services/pages/templates"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

func RegisterService(app *pocketbase.PocketBase) {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		e.Router.GET("/*", func(c echo.Context) error {
			path := c.Request().URL.Path
			records, err := app.Dao().FindRecordsByFilter(
				"pages",
				"path = {:path}",
				"-created",
				1, 0,
				dbx.Params{"path": path},
			)

			if err != nil {
				app.Logger().Error(
					"PAGES Failed to get page for path",
					"path", path,
					"error", err.Error(),
				)

				return apis.NewNotFoundError("Not Found.", nil)
			}

			if len(records) == 0 {
				if path == "/" {
					return c.HTML(200, templates.Templates["welcome"])
				}

				return apis.NewNotFoundError("Not Found.", nil)
			}

			record := records[0]
			html := record.GetString("html")
			return c.HTML(200, html)
		})

		return nil
	})
}
