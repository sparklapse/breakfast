package viewers

import (
	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

type ProfileItem struct {
	Type string `json:"type"`
	Url  string `json:"url"`
}

func registerProfileAPIs(app *pocketbase.PocketBase) {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		e.Router.GET("/api/breakfast/viewers/:id/profile-items", func(c echo.Context) error {
			viewerId := c.PathParam("id")
			if viewerId == "" {
				return c.JSON(400, map[string]string{"message": "Invalid viewer id"})
			}

			/*
				SELECT i.type, i.image
				FROM viewer_items as vi
				INNER JOIN items as i ON vi.item = i.id
				WHERE (i.type = 'PROFILE_BASE' OR i.type = 'PROFILE_ACCESSORY') AND vi.owner = {:viewerId};
			*/

			var query []struct {
				Type   string `db:"type"`
				ItemId string `db:"itemId"`
				Image  string `db:"image"`
			}
			{
				err := app.Dao().DB().
					Select(
						"i.type",
						"i.id as itemId",
						"i.image",
					).
					From("viewer_items as vi").
					Join(
						"INNER JOIN",
						"items as i",
						dbx.NewExp("vi.item = i.id"),
					).
					Where(dbx.NewExp(
						"(i.type = 'PROFILE_BASE' OR i.type = 'PROFILE_ACCESSORY') AND vi.owner = {:viewerId}",
						dbx.Params{"viewerId": viewerId},
					)).All(&query)

				if err != nil {
					return c.JSON(500, map[string]string{"message": "Failed to get viewer profile items", "error": err.Error()})
				}
			}

			baseItem := ""
			profileAccessoryItems := []string{}

			for _, row := range query {
				if row.Type == "PROFILE_BASE" {
					baseItem = "/api/files/items/" + row.ItemId + "/" + row.Image
					continue
				}

				profileAccessoryItems = append(
					profileAccessoryItems,
					"/api/files/items/"+row.ItemId+"/"+row.Image,
				)
			}

			return c.JSON(200, map[string]any{
				"base":        baseItem,
				"accessories": profileAccessoryItems,
			})
		})

		return nil
	})
}
