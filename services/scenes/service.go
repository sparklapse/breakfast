package scenes

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

//go:embed scene.html
var sceneTemplateRaw string
var sceneTemplate *template.Template

func init() {
	tmpl, err := template.New("scene").Parse(sceneTemplateRaw)
	if err != nil {
		panic("scene template is invalid")
	}

	sceneTemplate = tmpl
}

type SceneTemplateData struct {
	Label string
	Head  string
	Body  string
}

func RegisterService(app *pocketbase.PocketBase) {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		e.Router.GET("/scenes/render/:id", func(c echo.Context) error {
			sceneId := c.PathParam("id")
			if sceneId == "" {
				return c.JSON(404, map[string]string{"message": "Scene not found"})
			}

			scene, err := app.Dao().FindRecordById("scenes", sceneId)
			if err != nil {
				return c.JSON(404, map[string]string{"message": "Scene not found"})
			}

			label := scene.GetString("label")

			head := ""
			body := ""

			var scripts []struct {
				Filename string `json:"filename"`
				Script   string `json:"script"`
			}

			{
				err := json.Unmarshal(scene.Get("scripts").(types.JsonRaw), &scripts)
				if err != nil {
					return c.JSON(500, map[string]string{"message": "Bad scene"})
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

			body += scene.GetString("sources")

			return sceneTemplate.Execute(c.Response().Writer, SceneTemplateData{
				Label: label,
				Head:  head,
				Body:  body,
			})
		})

		return nil
	})
}
