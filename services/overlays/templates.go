package overlays

import (
	"breakfast/www/localoverlay"
	"breakfast/www/overlay"
	"encoding/json"
	"text/template"

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

func render(templ *template.Template, c echo.Context, app *pocketbase.PocketBase) error {
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
	scripts := ""
	body := ""

	var overlayScripts []struct {
		Script string `json:"script"`
	}

	{
		err := json.Unmarshal(overlayRecord.Get("scripts").(types.JsonRaw), &overlayScripts)
		if err != nil {
			return c.JSON(500, map[string]string{"message": "Bad overlay"})
		}
	}

	for _, script := range overlayScripts {
		scripts += "<script>" + script.Script + "</script>"
	}

	body += overlayRecord.GetString("sources")

	return templ.Execute(c.Response().Writer, overlay.OverlayTemplateParams{
		Title:   label,
		Styles:  styles,
		Body:    body,
		Scripts: scripts,
	})
}

func registerTemplateRoutes(app *pocketbase.PocketBase) {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		e.Router.GET("/overlays/template", func(c echo.Context) error {
			return overlay.OverlayTemplate.Execute(
				c.Response().Writer,
				overlay.OverlayTemplateParams{
					Title:   "template",
					Styles:  "",
					Body:    "",
					Scripts: "",
				},
			)
		})

		e.Router.GET("/overlays/local/template", func(c echo.Context) error {
			return localoverlay.LocalOverlayTemplate.Execute(
				c.Response().Writer,
				overlay.OverlayTemplateParams{
					Title:   "template",
					Styles:  "",
					Body:    "",
					Scripts: "",
				},
			)
		})

		e.Router.GET("/overlays/render/:id", func(c echo.Context) error {
			return render(overlay.OverlayTemplate, c, app)
		})

		e.Router.GET("/overlays/local/render/:id", func(c echo.Context) error {
			return render(localoverlay.LocalOverlayTemplate, c, app)
		})

		return nil
	})

}
