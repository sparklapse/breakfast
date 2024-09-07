package viewers

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

func registerManageAPIs(app *pocketbase.PocketBase) {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		e.Router.GET("/api/breakfast/viewers/list", func(c echo.Context) error {
			// Validate user is authenticated
			info := apis.RequestInfo(c)
			user := info.AuthRecord

			if user == nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			if user.Collection().Id != "users" {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			}

			pageQuery := c.QueryParam("page")
			perPageQuery := c.QueryParam("perPage")

			if pageQuery == "" {
				pageQuery = "1"
			}

			if perPageQuery == "" {
				perPageQuery = "20"
			}

			page, err := strconv.Atoi(pageQuery)
			if err != nil {
				return c.JSON(400, map[string]string{"message": "Failed to parse page query", "error": err.Error()})
			}
			perPage, err := strconv.Atoi(perPageQuery)
			if err != nil {
				return c.JSON(400, map[string]string{"message": "Failed to parse per page query", "error": err.Error()})
			}

			searchQuery := c.QueryParam("search")

			var query []struct {
				Id          string `db:"id" json:"id"`
				DisplayName string `db:"displayName" json:"displayName"`
				Providers   string `db:"providers" json:"providers"`
				ProviderIds string `db:"providerIds" json:"providerIds"`
			}

			{
				sql := app.Dao().DB().
					Select(
						"v.id",
						"v.displayName",
						"group_concat(e.provider) as providers",
						"group_concat(e.providerId) as providerIds",
					).
					From("viewers as v").
					Join(
						"INNER JOIN",
						"_externalAuths as e",
						dbx.NewExp("e.collectionId = 'viewers' AND e.recordId = v.id"),
					).
					GroupBy("v.id").
					OrderBy("v.created DESC").
					Limit(int64(perPage)).Offset(int64(perPage) * int64(page-1))

				var err error
				if searchQuery != "" {
					err = sql.Where(dbx.NewExp("displayName LIKE {:search}", dbx.Params{"search": "%" + searchQuery + "%"})).All(&query)
				} else {
					err = sql.All(&query)
				}

				if err != nil {
					return c.JSON(500, map[string]string{"message": "Failed to query viewers", "error": err.Error()})
				}
			}

			return c.JSON(200, query)
		})

		return nil
	})
}
