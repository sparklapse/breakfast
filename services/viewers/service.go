package viewers

import (
	"time"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

var pb *pocketbase.PocketBase

func RegisterService(app *pocketbase.PocketBase) {
	pb = app

	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		e.Router.GET("/api/breakfast/viewers/count", func(c echo.Context) error {
			response := map[string]int{}

			var query struct {
				Count int `db:"count"`
			}

			{
				err := app.Dao().DB().
					Select("COUNT(*) as count").
					From("viewers").
					One(&query)
				if err != nil {
					return c.JSON(500, map[string]string{"message": "Failed to count viewers", "error": err.Error()})
				}
			}

			response["total"] = query.Count

			{
				err := app.Dao().DB().
					Select("COUNT(*) as count").
					From("viewers").
					Where(dbx.NewExp("created > {:timeFrame}", dbx.Params{"timeFrame": time.Now().Add(30 * 24 * time.Hour * -1)})).
					One(&query)
				if err != nil {
					return c.JSON(500, map[string]string{"message": "Failed to count new viewers", "error": err.Error()})
				}
			}

			response["new30"] = query.Count

			return c.JSON(200, response)
		})

		return nil
	})
}
