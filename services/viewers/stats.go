package viewers

import (
	"time"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

func registerStatAPIs(app *pocketbase.PocketBase) {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		e.Router.GET("/api/breakfast/viewers/currencies", func(c echo.Context) error {
			var query []struct {
				Currency string
			}

			err := app.Dao().DB().
				Select("json_each.key AS currency").
				Distinct(true).
				From("viewers, json_each(viewers.wallet, '$')").
				All(&query)
			if err != nil {
				return c.JSON(500, map[string]string{"message": "Failed to query distinct currencies"})
			}

			currencies := []string{}
			for _, row := range query {
				if row.Currency == "" {
					continue
				}

				currencies = append(currencies, row.Currency)
			}

			return c.JSON(200, map[string]any{"currencies": currencies})
		})

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
