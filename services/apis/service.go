package apis

import (
    "net/http"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

func RegisterService(app *pocketbase.PocketBase) {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		getTwitchSettings()
		return nil
	})

	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		e.Router.GET("/redirect/to-provider/:provider/:id", func(c echo.Context) error {
			// Validate user is authenticated
			info := apis.RequestInfo(c)
			user := info.AuthRecord

			if user == nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			if user.Collection().Id != "users" {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			provider := c.PathParams().Get("provider", "unknown")
			id := c.PathParams().Get("id", "unknown")

			if provider == "unknown" || id == "unknown" {
				return c.JSON(400, map[string]string{"message": "Invalid provider or id"})
			}

			switch provider {
			case "twitch":
				user, err := GetTwitchUserById(id)
				if err != nil {
					app.Logger().Error(
						"APIS Failed to get twitch user for redirect",
						"error", err.Error(),
					)
					return c.JSON(400, map[string]string{"message": "Failed to get user by id"})
				}

				return c.Redirect(302, "https://twitch.tv/"+user.Login)
			default:
				return c.JSON(400, map[string]string{"message": "Invalid provider"})
			}
		})

		return nil
	})
}
