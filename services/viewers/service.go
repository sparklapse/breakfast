package viewers

import (
	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

var pb *pocketbase.PocketBase

func RegisterService(app *pocketbase.PocketBase) {
	pb = app

	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		e.Router.GET("/api/breakfast/viewers/count", func(c echo.Context) error {
			var query struct {
				Count int `db:"count"`
			}
			err := app.Dao().DB().
				Select("COUNT(*) as count").
				From("viewers").
				One(&query)
			if err != nil {
				return c.JSON(500, map[string]string{"message": "Failed to count viewers"})
			}

			return c.JSON(200, map[string]int{"count": query.Count})
		})

		return nil
	})
}
