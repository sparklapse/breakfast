//go:build remote

package remote

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tokens"
	"github.com/pocketbase/pocketbase/tools/security"
	"github.com/pocketbase/pocketbase/tools/types"
)

type UserRequest struct {
	Type string            `json:"type"`
	Data map[string]string `json:"data"`
}

type User struct {
	Id           string `db:"id"`
	Username     string `db:"username"`
	PasswordHash string `db:"passwordHash"`
}

func RegisterService(app *pocketbase.PocketBase) {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		if shared_secret == "" {
			println("Remote APIs are enabled but environment isn't configured correctly")
			return nil
		}

		e.Router.POST("/api/breakfast/remote", func(c echo.Context) error {
			// Auth check
			{
				// We use a custom header instead of Authorization since PB will try and db lookup the user
				auth := c.Request().Header.Get("remote-token")
				if auth == "" {
					return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
				}

				err := verifyToken(auth)
				if err != nil {
					e.App.Logger().Error(err.Error())
					return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unathorized"})
				}
			}

			return c.JSON(http.StatusOK, map[string]string{
				"message": "OK",
			})
		})

		e.Router.POST("/api/breakfast/remote/user", func(c echo.Context) error {
			// Auth check
			{
				// We use a custom header instead of Authorization since PB will try and db lookup the user
				auth := c.Request().Header.Get("remote-token")
				if auth == "" {
					return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
				}

				err := verifyToken(auth)
				if err != nil {
					e.App.Logger().Error(err.Error())
					return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unathorized"})
				}
			}

			if c.Request().ContentLength <= 0 {
				return c.JSON(http.StatusBadRequest, map[string]string{"meesage": "Bad request"})
			}

			var request_data UserRequest
			{
				err := c.Bind(&request_data)
				if err != nil {
					return c.JSON(http.StatusBadRequest, map[string]string{"message": err.Error()})
				}
			}

			switch request_data.Type {
			case "authenticate":
				user_id := request_data.Data["id"]
				record, err := e.App.Dao().FindRecordById("users", user_id)
				if err == sql.ErrNoRows {
					return c.JSON(http.StatusNotFound, map[string]string{"message": "User not found"})
				}

				if err != nil {
					return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
				}

				token, err := tokens.NewRecordAuthToken(e.App, record)
				if err != nil {
					return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
				}

				return c.JSON(http.StatusOK, map[string]string{
					"message": "OK",
					"token":   token,
					"url":     e.App.Settings().Meta.AppUrl + "/breakfast?token=" + token,
				})
			case "configure":
				user_id := request_data.Data["id"]
				username := request_data.Data["username"]
				password_hash := request_data.Data["passwordHash"]

				// Password hash can be empty since we can generate tokens programmatically instead
				if user_id == "" || username == "" {
					return c.JSON(http.StatusBadRequest, map[string]string{"message": "Missing data"})
				}

				var user User
				err := e.App.Dao().DB().
					Select("id", "username", "passwordHash").
					From("users").
					Where(dbx.NewExp("id = {:id}", dbx.Params{"id": user_id})).
					One(&user)

				if err != nil && err != sql.ErrNoRows {
					return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
				}

				if err == sql.ErrNoRows {
					_, err := e.App.Dao().DB().
						Insert("users", dbx.Params{
							"created":                time.Now().UTC().Format(types.DefaultDateLayout),
							"email":                  "",
							"emailVisibility":        0,
							"id":                     user_id,
							"lastResetSentAt":        "",
							"lastVerificationSentAt": "",
							"passwordHash":           password_hash,
							"tokenKey":               security.RandomString(50),
							"updated":                time.Now().UTC().Format(types.DefaultDateLayout),
							"username":               username,
							"verified":               1,
							"lastLoginAlertSentAt":   "",
							"streamKey":              security.RandomString(21),
						}).
						Execute()
					if err != nil {
						return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
					}
				} else {
					_, err := e.App.Dao().DB().
						Update("users", dbx.Params{
							"updated":      time.Now().UTC().Format(types.DefaultDateLayout),
							"passwordHash": password_hash,
							"username":     username,
						}, dbx.NewExp("id = {:id}", dbx.Params{"id": user_id})).
						Execute()
					if err != nil {
						return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
					}
				}

				break
			case "remove":
				user_id := request_data.Data["id"]

				var user User
				err := e.App.Dao().DB().
					Select("id", "username", "passwordHash").
					From("users").
					Where(dbx.NewExp("id = {:id}", dbx.Params{"id": user_id})).
					One(&user)

				if err == sql.ErrNoRows {
					return c.JSON(http.StatusNotFound, map[string]string{"message": "Not found"})
				}

				if err != nil {
					return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
				}

				// Remove user record
				{
					_, err := e.App.Dao().DB().
						Delete("users", dbx.NewExp("id = {:id}", dbx.Params{"id": user_id})).
						Execute()

					if err != nil {
						return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
					}
				}

				// Removed linked auth providers
				{
					_, err := e.App.Dao().DB().
						Delete("_externalAuths", dbx.NewExp("recordId = {:id}", dbx.Params{"id": user_id})).
						Execute()

					if err != nil {
						return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
					}
				}

				break
			default:
				return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request type"})
			}

			return c.JSON(http.StatusOK, map[string]string{"message": "OK"})
		})

		return nil
	})
}
