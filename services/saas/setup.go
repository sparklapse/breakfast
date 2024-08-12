package saas

import (
	"database/sql"
	"errors"
	"os"
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

func setupBreakfast(app *pocketbase.PocketBase, username string, password string) error {
	usersCollection, err := app.Dao().FindCollectionByNameOrId("users")
	if err != nil {
		return err
	}

	if !usersCollection.IsAuth() {
		return errors.New("users collection is not of type auth")
	}

	newUser := models.NewRecord(usersCollection)
	newUser.SetId("owner")
	newUser.Set("streamKey", security.RandomString(21))
	newUser.SetUsername(username)
	newUser.SetPassword(password)
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

	return nil
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
		password := security.RandomString(32)
		nullAdmin.SetPassword(password)

		app.Logger().Debug("Created null admin: nu@ll.dev - " + password)

		return app.Dao().SaveAdmin(nullAdmin)
	})

	// Self service user setup APIs
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

		username, preSetup := os.LookupEnv("BREAKFAST_PRE_SETUP")
		if preSetup && !isSetup {
			err := setupBreakfast(app, username, security.RandomString(128))
			if err != nil {
				return err
			}

			isSetup = true
			return nil
		}

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

			err := setupBreakfast(app, setup.Username, setup.Password)
			if err != nil {
				return err
			}

			isSetup = true
			return nil
		})

		return nil
	})

	// Setup environment
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		settings, err := app.Dao().FindSettings()
		if err != nil {
			return err
		}

		{
			appUrl, appUrlExists := os.LookupEnv("BREAKFAST_APP_URL")

			if appUrlExists {
				settings.Meta.AppUrl = appUrl
			}
		}

		{
			clientId, clientIdExists := os.LookupEnv("BREAKFAST_TWITCH_CLIENT_ID")
			clientSecret, clientSecretExists := os.LookupEnv("BREAKFAST_TWITCH_CLIENT_SECRET")

			if clientIdExists && clientSecretExists {
				settings.TwitchAuth.ClientId = clientId
				settings.TwitchAuth.ClientSecret = clientSecret
				settings.TwitchAuth.Enabled = true
			}
		}

		return app.Dao().SaveSettings(settings)
	})
}
