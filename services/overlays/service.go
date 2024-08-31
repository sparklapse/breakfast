package overlays

import (
	"breakfast/www/overlay"
	"encoding/json"
	"strings"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/types"
)

type OverlayTemplateData struct {
	Label string
	Head  string
	Body  string
}

func RegisterService(app *pocketbase.PocketBase) {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		e.Router.GET("/overlays/template", func(c echo.Context) error {
			return overlay.OverlayTemplate.Execute(c.Response().Writer, overlay.OverlayTemplateParams{
				Title:  "template",
				Styles: "",
				Body:   "",
				Logic:  "",
			})
		})

		e.Router.GET("/overlays/render/:id", func(c echo.Context) error {
			overlayId := c.PathParam("id")
			if overlayId == "" {
				return c.JSON(404, map[string]string{"message": "Overlay not found"})
			}

			overlayRecord, err := app.Dao().FindRecordById("overlays", overlayId)
			if err != nil {
				return c.JSON(404, map[string]string{"message": "Overlay not found"})
			}

			label := overlayRecord.GetString("label")

			styles := ""
			logic := ""
			body := ""

			var scripts []struct {
				Filename string `json:"filename"`
				Script   string `json:"script"`
			}

			{
				err := json.Unmarshal(overlayRecord.Get("scripts").(types.JsonRaw), &scripts)
				if err != nil {
					return c.JSON(500, map[string]string{"message": "Bad overlay"})
				}
			}

			for _, script := range scripts {
				if strings.HasSuffix(script.Filename, ".css") {
					styles += "<style>" + script.Script + "</style>"
					continue
				}

				if strings.HasSuffix(script.Filename, ".js") {
					logic += "<script>" + script.Script + "</script>"
					continue
				}
			}

			body += overlayRecord.GetString("sources")

			return overlay.OverlayTemplate.Execute(c.Response().Writer, overlay.OverlayTemplateParams{
				Title:  label,
				Styles: styles,
				Body:   body,
				Logic:  logic,
			})
		})

		return nil
	})
}
