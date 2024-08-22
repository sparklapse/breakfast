package overlays

import (
	_ "embed"
	"encoding/json"
	"strings"
	"text/template" // We're using text templating instead of html since otherwise things get sanitised when we don't want it to be

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/types"
)

//go:embed overlay.html
var overlayTemplateRaw string
var overlayTemplate *template.Template

func init() {
	tmpl, err := template.New("overlay").Parse(overlayTemplateRaw)
	if err != nil {
		panic("overlay template is invalid")
	}

	overlayTemplate = tmpl
}

type OverlayTemplateData struct {
	Label string
	Head  string
	Body  string
}

func RegisterService(app *pocketbase.PocketBase) {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		e.Router.GET("/overlays/render/:id", func(c echo.Context) error {
			overlayId := c.PathParam("id")
			if overlayId == "" {
				return c.JSON(404, map[string]string{"message": "Overlay not found"})
			}

			overlay, err := app.Dao().FindRecordById("overlays", overlayId)
			if err != nil {
				return c.JSON(404, map[string]string{"message": "Overlay not found"})
			}

			label := overlay.GetString("label")

			head := ""
			body := ""

			var scripts []struct {
				Filename string `json:"filename"`
				Script   string `json:"script"`
			}

			{
				err := json.Unmarshal(overlay.Get("scripts").(types.JsonRaw), &scripts)
				if err != nil {
					return c.JSON(500, map[string]string{"message": "Bad overlay"})
				}
			}

			for _, script := range scripts {
				if strings.HasSuffix(script.Filename, ".css") {
					head += "<style>" + script.Script + "</style>"
					continue
				}

				if strings.HasSuffix(script.Filename, ".js") {
					head += "<script>" + script.Script + "</script>"
					continue
				}
			}

			body += overlay.GetString("sources")

			return overlayTemplate.Execute(c.Response().Writer, OverlayTemplateData{
				Label: label,
				Head:  head,
				Body:  body,
			})
		})

		return nil
	})
}
