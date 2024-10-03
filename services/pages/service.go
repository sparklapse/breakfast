package pages

import (
	"strings"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
    "github.com/aymerick/raymond"
)

func RegisterService(app *pocketbase.PocketBase) {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		e.Router.GET("/*", func(c echo.Context) error {
			path := c.Request().URL.Path
			records, err := app.Dao().FindRecordsByFilter(
				"pages",
				"path = {:path}",
				"-created",
				1, 0,
				dbx.Params{"path": path},
			)

			if err != nil {
				app.Logger().Error(
					"PAGES Failed to get page for path",
					"path", path,
					"error", err.Error(),
				)

				return apis.NewNotFoundError("Not Found.", nil)
			}

			if len(records) == 0 {
				// if path == "/" {
				// 	return c.HTML(200, www.Templates["welcome"])
				// }

				return apis.NewNotFoundError("Not Found.", nil)
			}

			record := records[0]
			html := record.GetString("html")

			if record.GetString("data") == "null" {
				return c.HTML(200, html)
			}

			var translations []map[string]any
			{
				err := record.UnmarshalJSONField("data", &translations)
				if err != nil {
					app.Logger().Error(
						"PAGES Failed to parse page data",
						"error", err.Error(),
					)

					// Render page as html to try and recover anyways
					return c.HTML(200, html)
				}
			}

			if len(translations) == 0 {
				app.Logger().Warn(
					"PAGES Translations was empty",
					"pageId", record.Id,
					"path", record.GetString("path"),
				)

				return c.HTML(200, html)
			}

			requestedLang := c.QueryParam("lang")
			accepted := strings.Split(c.Request().Header.Get("Accept-Language"), ";")
			for _, translation := range translations {
				lang, ok := translation["lang"].(string)
				if !ok {
					app.Logger().Warn(
						"PAGES Translation didn't contain a lang field",
						"pageId", record.Id,
						"path", record.GetString("path"),
					)
					continue
				}

				if requestedLang != "" {
					if lang == requestedLang {
						rendered, err := raymond.Render(html, translation)
						if err != nil {
							app.Logger().Error(
								"PAGES Failed to parse page template",
								"error", err.Error(),
							)
							return c.HTML(200, html)
						}
						return c.HTML(200, rendered)
					}
					continue
				}

				for _, accept := range accepted {
					sections := strings.Split(accept, ",")
					for _, section := range sections {
						if strings.HasPrefix(section, lang) {
                            rendered, err := raymond.Render(html, translation)
                            if err != nil {
                                app.Logger().Error(
                                    "PAGES Failed to parse page template",
                                    "error", err.Error(),
                                )
                                return c.HTML(200, html)
                            }
                            return c.HTML(200, rendered)
						}
					}
				}
			}

			// Couldn't find a suitable translation so default to first available
			data := translations[0]
			{
				c.Response().WriteHeader(200)
                rendered, err := raymond.Render(html, data)
                if err != nil {
                    app.Logger().Error(
                        "PAGES Failed to parse page template",
                        "error", err.Error(),
                    )
                    return c.HTML(200, html)
                }
                return c.HTML(200, rendered)
			}
		})

		return nil
	})
}
