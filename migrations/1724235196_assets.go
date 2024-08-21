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
		// Create a new assets collection
		{
			dao := daos.New(db)

			collection := &models.Collection{
				Name:       "assets",
				Type:       "base",
				System:     true,
				ListRule:   types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				ViewRule:   types.Pointer(""),
				CreateRule: types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				UpdateRule: types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				DeleteRule: types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				Indexes:    types.JsonArray[string]{},
				Options:    types.JsonMap{},
				Schema: schema.NewSchema(
					&schema.SchemaField{
						Id:          "label",
						Name:        "label",
						Type:        schema.FieldTypeText,
						Required:    false,
						Presentable: false,
						Options: types.JsonMap{
							"min":     nil,
							"max":     nil,
							"pattern": "",
						},
					},
					&schema.SchemaField{
						Id:          "asset",
						Name:        "asset",
						Type:        schema.FieldTypeFile,
						Required:    true,
						Presentable: false,
						Options: types.JsonMap{
							"mimeTypes": types.JsonArray[string]{
								"image/jpeg",
								"image/png",
								"image/svg+xml",
								"image/gif",
								"image/webp",
							},
							"thumbs": types.JsonArray[string]{
								"512x512f",
								"1024x1024f",
							},
							"maxSelect": 1,
							"maxSize":   100_000_000, // 100 Megabytes
							"protected": false,
						},
					},
				),
			}

			collection.SetId("assets")

			dao.SaveCollection(collection)
		}

		return nil
	}, nil)
}
