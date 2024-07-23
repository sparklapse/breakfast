package migrations

import (
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/models/schema"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		// Create a new pages collection
		{
			dao := daos.New(db)

			collection := &models.Collection{
				Name:       "pages",
				Type:       "base",
				System:     true,
				ListRule:   types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				ViewRule:   types.Pointer(""),
				CreateRule: types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				UpdateRule: types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				DeleteRule: types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				Indexes: types.JsonArray[string]{
					"CREATE INDEX pages_path_idx ON pages (path)",
				},
				Options: types.JsonMap{},
				Schema: schema.NewSchema(
					&schema.SchemaField{
						Id:          "path",
						Name:        "path",
						Type:        schema.FieldTypeText,
						Required:    true,
						Presentable: false,
						Options: types.JsonMap{
							"min":     nil,
							"max":     nil,
							"pattern": "",
						},
					},
					&schema.SchemaField{
						Id:          "html",
						Name:        "html",
						Type:        schema.FieldTypeText,
						Required:    true,
						Presentable: false,
						Options: types.JsonMap{
							"min":     nil,
							"max":     nil,
							"pattern": "",
						},
					},
				),
			}

			collection.SetId("pages")

			dao.SaveCollection(collection)
		}

		return nil
	}, nil)
}
