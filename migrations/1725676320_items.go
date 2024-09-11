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
		// Create a new items collection
		{
			dao := daos.New(db)

			collection := &models.Collection{
				Name:       "items",
				Type:       "base",
				System:     true,
				ListRule:   types.Pointer("visibility = \"PUBLIC\" || (@request.auth.verified = true && @request.auth.collectionName = \"users\")"),
				ViewRule:   types.Pointer("visibility = \"PUBLIC\" || visibility = \"UNLISTED\" || (@request.auth.verified = true && @request.auth.collectionName = \"users\")"),
				CreateRule: types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				UpdateRule: types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				DeleteRule: types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				Indexes:    types.JsonArray[string]{},
				Options:    types.JsonMap{},
				Schema: schema.NewSchema(
					&schema.SchemaField{
						Id:          "type",
						Name:        "type",
						Type:        schema.FieldTypeSelect,
						Required:    true,
						Presentable: false,
						Options: types.JsonMap{
							"maxSelect": 1,
							"values": types.JsonArray[string]{
								"BADGE",
								"COLLECTABLE",
								"PROFILE_BASE",
								"PROFILE_ACCESSORY",
							},
						},
					},
					&schema.SchemaField{
						Id:          "image",
						Name:        "image",
						Type:        schema.FieldTypeFile,
						Required:    false,
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
								"256x256f",
								"512x512f",
							},
							"maxSelect": 1,
							"maxSize":   100_000_000, // 100 Megabytes
							"protected": false,
						},
					},
					&schema.SchemaField{
						Id:          "label",
						Name:        "label",
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
						Id:          "description",
						Name:        "description",
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
						Id:          "action",
						Name:        "action",
						Type:        schema.FieldTypeJson,
						Required:    false,
						Presentable: false,
						Options: types.JsonMap{
							"maxSize": 100_000_000, // 100 Megabytes
						},
					},
					&schema.SchemaField{
						Id:          "shopPurchasable",
						Name:        "shopPurchasable",
						Type:        schema.FieldTypeBool,
						Required:    false,
						Presentable: false,
						Options:     types.JsonMap{},
					},
					&schema.SchemaField{
						Id:          "shopInfo",
						Name:        "shopInfo",
						Type:        schema.FieldTypeJson,
						Required:    false,
						Presentable: false,
						Options: types.JsonMap{
							"maxSize": 100_000_000, // 100 Megabytes
						},
					},
					&schema.SchemaField{
						Id:          "meta",
						Name:        "meta",
						Type:        schema.FieldTypeJson,
						Required:    false,
						Presentable: false,
						Options: types.JsonMap{
							"maxSize": 100_000_000, // 100 Megabytes
						},
					},
					&schema.SchemaField{
						Id:          "visibility",
						Name:        "visibility",
						Type:        schema.FieldTypeSelect,
						Required:    true,
						Presentable: false,
						Options: types.JsonMap{
							"maxSelect": 1,
							"values": types.JsonArray[string]{
								"PRIVATE",
								"UNLISTED",
								"PUBLIC",
							},
						},
					},
				),
			}

			collection.SetId("items")

			dao.SaveCollection(collection)
		}

		return nil
	}, nil)
}
