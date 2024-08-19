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
		// Create a new users collection
		{
			dao := daos.New(db)

			collection := &models.Collection{
				Name:       "scenes",
				Type:       "base",
				System:     true,
				ListRule:   types.Pointer("owner.id = @request.auth.id || visibility = \"PUBLIC\""),
				ViewRule:   types.Pointer("owner.streamKey = @request.query.sk || owner.id = @request.auth.id || visibility = \"PUBLIC\" || visibility = \"UNLISTED\""),
				CreateRule: types.Pointer("owner.id = @request.auth.id"),
				UpdateRule: types.Pointer("owner.id = @request.auth.id"),
				DeleteRule: types.Pointer("owner.id = @request.auth.id"),
				Indexes: types.JsonArray[string]{
					"CREATE INDEX scenes_owner_idx ON scenes (owner)",
				},
				Options: types.JsonMap{},
				Schema: schema.NewSchema(
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
						Id:          "owner",
						Name:        "owner",
						Type:        schema.FieldTypeRelation,
						Required:    true,
						Presentable: false,
						Options: types.JsonMap{
							"collectionId":  "users",
							"cascadeDelete": true,
							"minSelect":     nil,
							"maxSelect":     1,
							"displayFields": nil,
						},
					},
					&schema.SchemaField{
						Id:          "scripts",
						Name:        "scripts",
						Type:        schema.FieldTypeJson,
						Required:    false,
						Presentable: false,
						Options: types.JsonMap{
							"maxSize": 1_000_000_000, // 1GB
						},
					},
					&schema.SchemaField{
						Id:          "sources",
						Name:        "sources",
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
						Id:          "logic",
						Name:        "logic",
						Type:        schema.FieldTypeJson,
						Required:    false,
						Presentable: false,
						Options: types.JsonMap{
							"maxSize": 1_000_000_000, // 1GB
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

			collection.SetId("scenes")

			dao.SaveCollection(collection)
		}

		return nil
	}, nil)
}
