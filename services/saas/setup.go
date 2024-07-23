//go:build saas

package saas

import (
	"database/sql"
	"errors"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/tools/security"
	"github.com/pocketbase/pocketbase/tools/types"
)

type setupRow struct {
	Key   string `db:"key"`
	Value string `db:"value"`
}

type setupRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func registerSetup(app *pocketbase.PocketBase) {
	// null admin user
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		count, err := app.Dao().TotalAdmins()
		if err != nil {
			return err
		}

		if count > 0 {
			return nil
		}

		nullAdmin := &models.Admin{}
		nullAdmin.Email = "nu@ll.dev"
		nullAdmin.SetPassword(security.RandomString(128))

		return app.Dao().SaveAdmin(nullAdmin)
	})

	// Self service setup APIs
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		isSetup := true

		var setup setupRow
		{
			err := app.Dao().DB().
				Select("key", "value").
				From("_params").
				Where(dbx.NewExp("key = 'breakfast-setup'")).
				One(&setup)
			if err != nil && !errors.Is(err, sql.ErrNoRows) {
				return err
			}
			if errors.Is(err, sql.ErrNoRows) {
				isSetup = false
			}
		}

		e.Router.GET("/api/breakfast/setup", func(c echo.Context) error {
			return c.JSON(200, isSetup)
		})

		e.Router.POST("/api/breakfast/setup", func(c echo.Context) error {
			if isSetup {
				return c.JSON(401, map[string]any{"message": "Unauthorized"})
			}

			var setup setupRequest
			{
				err := c.Bind(&setup)
				if err != nil {
					return err
				}
			}

			if setup.Username == "" || setup.Password == "" {
				return c.JSON(400, map[string]any{"message": "Bad request"})
			}

			usersCollection, err := app.Dao().FindCollectionByNameOrId("users")
			if err != nil {
				return err
			}

			if !usersCollection.IsAuth() {
				return errors.New("users collection is not of type auth")
			}

			newUser := models.NewRecord(usersCollection)
			newUser.Set("streamKey", security.RandomString(21))
			newUser.SetUsername(setup.Username)
			newUser.SetPassword(setup.Password)
			newUser.SetVerified(true)

			{
				err := app.Dao().SaveRecord(newUser)
				if err != nil {
					return err
				}
			}

			{
				_, err := app.Dao().DB().Insert("_params", dbx.Params{
					"id":      security.RandomString(15),
					"key":     "breakfast-setup",
					"value":   "true",
					"created": time.Now().UTC().Format(types.DefaultDateLayout),
					"updated": time.Now().UTC().Format(types.DefaultDateLayout),
				}).Execute()

				if err != nil {
					return err
				}
			}

			isSetup = true
			return nil
		})

		return nil
	})
}
