package saas

import (
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"slices"
	"strings"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tokens"
	"github.com/pocketbase/pocketbase/tools/security"
	"github.com/pocketbase/pocketbase/tools/types"
)

type Payload struct {
	Nonce     string   `json:"nonce"`
	Timestamp string   `json:"timestamp"`
	Scopes    []string `json:"scopes"`
}

var sharedSecret string = ""

func init() {
	secret, success := os.LookupEnv("BREAKFAST_REMOTE_SECRET")
	if !success || secret == "" {
		return
	}

	sharedSecret = secret
}

func generateHmac(message []byte) string {
	h := hmac.New(sha256.New, []byte(sharedSecret))
	h.Write(message)
	hash := h.Sum(nil)
	return hex.EncodeToString(hash)
}

func verifyHmac(message []byte, hash string) bool {
	expected := generateHmac(message)
	return hmac.Equal([]byte(expected), []byte(hash))
}

func verifyToken(token string) error {
	parts := strings.SplitN(token, ".", 2)

	if len(parts) < 2 {
		return errors.New("invalid token")
	}

	basePayload := parts[0]
	hash := parts[1]
	rawPayload, err := base64.StdEncoding.DecodeString(basePayload)
	if err != nil {
		return errors.New("invalid payload")
	}

	var payload Payload
	{
		err := json.Unmarshal([]byte(rawPayload), &payload)
		if err != nil {
			return errors.New("invalid payload")
		}
	}

	if payload.Nonce == "" {
		return errors.New("no nonce was included")
	}

	if len(payload.Nonce) < 21 {
		return errors.New("invalid nonce")
	}

	if payload.Timestamp == "" {
		return errors.New("")
	}

	ts, err := time.Parse(time.RFC3339, payload.Timestamp)
	if err != nil {
		return errors.Join(errors.New("failed to parse payload timestamp"), err)
	}

	if ts.Before(time.Now().Add(-10 * time.Minute)) {
		return errors.New("timestamp request too old")
	}

	if !slices.Contains(payload.Scopes, "remote") {
		return errors.New("remote scope not included")
	}

	hmacPassed := verifyHmac([]byte(basePayload), hash)
	if !hmacPassed {
		return errors.New("hmac check failed")
	}

	return nil
}

func registerRemote(app *pocketbase.PocketBase) {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		if sharedSecret == "" {
			return nil
		}

		app.Logger().Info("SAAS Remote APIs enabled")

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

			var requestData UserRequest
			{
				err := c.Bind(&requestData)
				if err != nil {
					return c.JSON(http.StatusBadRequest, map[string]string{"message": err.Error()})
				}
			}

			switch requestData.Type {
			case "authenticate":
				userId := requestData.Data["id"]
				record, err := e.App.Dao().FindRecordById("users", userId)
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
				userId := requestData.Data["id"]
				username := requestData.Data["username"]
				passwordHash := requestData.Data["passwordHash"]

				// Password hash can be empty since we can generate tokens programmatically instead
				if userId == "" || username == "" {
					return c.JSON(http.StatusBadRequest, map[string]string{"message": "Missing data"})
				}

				var user User
				err := e.App.Dao().DB().
					Select("id", "username", "passwordHash").
					From("users").
					Where(dbx.NewExp("id = {:id}", dbx.Params{"id": userId})).
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
							"id":                     userId,
							"lastResetSentAt":        "",
							"lastVerificationSentAt": "",
							"passwordHash":           passwordHash,
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
							"passwordHash": passwordHash,
							"username":     username,
						}, dbx.NewExp("id = {:id}", dbx.Params{"id": userId})).
						Execute()
					if err != nil {
						return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
					}
				}
			case "remove":
				userId := requestData.Data["id"]

				var user User
				err := e.App.Dao().DB().
					Select("id", "username", "passwordHash").
					From("users").
					Where(dbx.NewExp("id = {:id}", dbx.Params{"id": userId})).
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
						Delete("users", dbx.NewExp("id = {:id}", dbx.Params{"id": userId})).
						Execute()

					if err != nil {
						return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
					}
				}

				// Removed linked auth providers
				{
					_, err := e.App.Dao().DB().
						Delete("_externalAuths", dbx.NewExp("recordId = {:id}", dbx.Params{"id": userId})).
						Execute()

					if err != nil {
						return c.JSON(http.StatusInternalServerError, map[string]string{"message": err.Error()})
					}
				}
			default:
				return c.JSON(http.StatusBadRequest, map[string]string{"message": "Invalid request type"})
			}

			return c.JSON(http.StatusOK, map[string]string{"message": "OK"})
		})

		return nil
	})
}
