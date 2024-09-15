package viewers

import (
	"database/sql"
	"errors"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/security"
)

var defaultProfileBaseItemId = ""

func SetDefaultProfileBase(recordId string) error {
	record, err := pb.Dao().FindRecordById("items", recordId)
	if err != nil {
		return err
	}

	var existing struct {
		Value string `db:"value"`
	}
	{
		err := pb.Dao().DB().
			Select("value").
			From("_params").
			Where(dbx.NewExp("key = 'breakfast-items-default-profile-base'")).
			One(&existing)

		if errors.Is(err, sql.ErrNoRows) {
			_, err := pb.Dao().DB().Insert("_params", dbx.Params{
				"id":      security.RandomString(15),
				"key":     "breakfast-items-default-profile-base",
				"value":   record.Id,
				"created": time.Now(),
				"updated": time.Now(),
			}).Execute()
			if err != nil {
				return err
			}

			return nil
		}

		if err != nil {
			return err
		}
	}

	{
		_, err := pb.Dao().DB().Update(
			"_params", dbx.Params{
				"value":   record.Id,
				"updated": time.Now(),
			},
			dbx.NewExp("key = 'breakfast-items-default-profile-base'"),
		).Execute()
		if err != nil {
			return err
		}
	}

	defaultProfileBaseItemId = record.Id

	return nil
}

func registerItemsService(app *pocketbase.PocketBase) {
	// Load default profile base item
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		var defaults struct {
			Value string `db:"value"`
		}
		{
			err := pb.Dao().DB().
				Select("value").
				From("_params").
				Where(dbx.NewExp("key = 'breakfast-items-default-profile-base'")).
				One(&defaults)

			if errors.Is(err, sql.ErrNoRows) {
				return nil
			}

			if err != nil {
				return err
			}
		}

		defaultProfileBaseItemId = defaults.Value
		return nil
	})

	// Set default profile base item when item with default flag set
	app.OnRecordAfterCreateRequest("items").Add(func(e *core.RecordCreateEvent) error {
		if e.Record.GetString("type") == "PROFILE_BASE" {
			mpbd := e.HttpContext.QueryParam("makeProfileBaseDefault")
			if mpbd == "true" {
				err := SetDefaultProfileBase(e.Record.Id)
				if err != nil {
					app.Logger().Error(
						"ITEMS Failed to set default profile base item",
						"error", err.Error(),
					)
				}
			}
		}

		return nil
	})

	// Unset default profile base item
	app.OnRecordAfterDeleteRequest("items").Add(func(e *core.RecordDeleteEvent) error {
		if e.Record.Id == defaultProfileBaseItemId {
			defaultProfileBaseItemId = ""

			pb.Dao().DB().
				Delete(
					"_params",
					dbx.NewExp("key = 'breakfast-items-default-profile-base'"),
				).
				Execute()
		}

		return nil
	})

	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		e.Router.GET("/api/breakfast/viewers/default-profile-base", func(c echo.Context) error {
			return c.JSON(200, map[string]string{"id": defaultProfileBaseItemId})
		})

		return nil
	})
}
