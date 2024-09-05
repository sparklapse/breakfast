package overlays

import (
	"breakfast/services/events/listener"
	"breakfast/services/events/types"
	"net/http"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/security"
)

func registerActionAPIs(app *pocketbase.PocketBase) {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		e.Router.POST("/api/breakfast/overlays/action", func(c echo.Context) error {
			// Validate user is authenticated
			info := apis.RequestInfo(c)
			user := info.AuthRecord

			if user == nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			if user.Collection().Id != "users" {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			var request types.Action

			err := c.Bind(&request)
			if err != nil {
				return c.JSON(400, map[string]string{"message": "Failed to parse action"})
			}

			listener.EmitEvent("actions", security.RandomString(15), types.BreakfastEvent{
				Type:     types.EventTypeAction,
				Platform: "actions",
				Data:     request,
			})

			return c.JSON(200, map[string]string{"message": "OK"})
		})

		return nil
	})
}
