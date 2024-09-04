package events

import (
	"breakfast/services/events/listener"
	"breakfast/services/events/types"
	"net/http"
	"slices"
	"strings"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

func registerSettingsAPIs(app *pocketbase.PocketBase) {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		// Manual purge
		e.Router.POST("/api/breakfast/events/purge-old", func(c echo.Context) error {
			info := apis.RequestInfo(c)
			user := info.AuthRecord

			if user == nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			if user.Collection().Id != "users" {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			err := purgeOldEvents(app)
			if err != nil {
				return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to purge events", "error": err.Error()})
			}

			return nil
		})

		e.Router.POST("/api/breakfast/events/purge-all", func(c echo.Context) error {
			info := apis.RequestInfo(c)
			user := info.AuthRecord

			if user == nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			if user.Collection().Id != "users" {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			err := purgeAllEvents(app)
			if err != nil {
				return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed to purge events", "error": err.Error()})
			}

			return nil
		})

		// Event storage duration
		e.Router.GET("/api/breakfast/events/settings/stored-duration", func(c echo.Context) error {
			info := apis.RequestInfo(c)
			user := info.AuthRecord

			if user == nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			if user.Collection().Id != "users" {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			var query struct {
				Value string `db:"value"`
			}

			err := app.Dao().DB().
				Select("value").
				From("_params").
				Where(dbx.NewExp("key = 'breakfast-events-stored-duration'")).
				One(&query)

			if err != nil {
				return c.JSON(http.StatusInternalServerError, map[string]string{"message": "Failed te get storage duration from db", "error": err.Error()})
			}

			return c.JSON(http.StatusOK, map[string]string{
				"duration": query.Value,
			})
		})

		e.Router.POST("/api/breakfast/events/settings/stored-duration", func(c echo.Context) error {
			info := apis.RequestInfo(c)
			user := info.AuthRecord

			if user == nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			if user.Collection().Id != "users" {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			var saved struct {
				Duration string `json:"duration"`
			}

			{
				err := c.Bind(&saved)
				if err != nil {
					return c.JSON(400, map[string]string{"message": "Bad request"})
				}
			}

			println(saved.Duration)

			{
				_, err := time.ParseDuration(saved.Duration)
				if err != nil {
					return c.JSON(400, map[string]string{"message": "Bad duration", "error": err.Error()})
				}
			}

			{
				_, err := app.Dao().DB().
					Update(
						"_params",
						dbx.Params{"value": saved.Duration},
						dbx.NewExp("key = 'breakfast-events-stored-duration'"),
					).
					Execute()
				if err != nil {
					return c.JSON(500, map[string]string{"message": "Failed to saved settings", "error": err.Error()})
				}
			}

			return c.JSON(200, map[string]string{
				"message": "OK",
			})
		})

		// Saved event types
		e.Router.GET("/api/breakfast/events/settings/saved-types", func(c echo.Context) error {
			info := apis.RequestInfo(c)
			user := info.AuthRecord

			if user == nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			if user.Collection().Id != "users" {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			return c.JSON(200, map[string][]string{
				"saved":     listener.SavedEventTypes,
				"available": types.AllEventTypes,
			})
		})

		e.Router.POST("/api/breakfast/events/settings/saved-types", func(c echo.Context) error {
			info := apis.RequestInfo(c)
			user := info.AuthRecord

			if user == nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			if user.Collection().Id != "users" {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			var saved struct {
				Types []string `json:"types"`
			}

			{
				err := c.Bind(&saved)
				if err != nil {
					return c.JSON(400, map[string]string{"message": "Bad request"})
				}
			}

			for _, t := range saved.Types {
				if !slices.Contains(types.AllEventTypes, t) {
					return c.JSON(400, map[string]string{"message": "Invalid type"})
				}
			}

			{
				_, err := app.Dao().DB().
					Update(
						"_params",
						dbx.Params{"value": strings.Join(saved.Types, ",")},
						dbx.NewExp("key = 'breakfast-events-saved-types'"),
					).
					Execute()
				if err != nil {
					return c.JSON(500, map[string]string{"message": "Failed to saved settings", "error": err.Error()})
				}
			}

			// Update memory cache to save having to query the database for every event coming in
			listener.SavedEventTypes = saved.Types

			return c.JSON(200, map[string]string{
				"message": "OK",
			})
		})
		return nil
	})
}
