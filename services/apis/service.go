package apis

import (
	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

var pb *pocketbase.PocketBase

func RegisterService(app *pocketbase.PocketBase) {
	pb = app

	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		getTwitchSettings()
		return nil
	})

	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		e.Router.GET("/redirect/to-provider/:provider/:id", func(c echo.Context) error {
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
