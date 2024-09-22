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
		// Create a new viewer_items collection
		{
			dao := daos.New(db)

			collection := &models.Collection{
				Name:       "viewer_items",
				Type:       "base",
				System:     true,
				ListRule:   types.Pointer("owner.id = @request.auth.id || (@request.auth.verified = true && @request.auth.collectionName = \"users\")"),
				ViewRule:   types.Pointer("owner.id = @request.auth.id"),
				CreateRule: types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				UpdateRule: types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				DeleteRule: types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				Indexes: types.JsonArray[string]{
					"CREATE INDEX viewer_items_owner_idx ON viewer_items (owner)",
					"CREATE INDEX viewer_items_item_idx ON viewer_items (item)",
				},
				Options: types.JsonMap{},
				Schema: schema.NewSchema(
					&schema.SchemaField{
						Id:          "owner",
						Name:        "owner",
						Type:        schema.FieldTypeRelation,
						Required:    true,
						Presentable: false,
						Options: types.JsonMap{
							"collectionId":  "viewers",
							"cascadeDelete": true,
							"minSelect":     nil,
							"maxSelect":     1,
							"displayFields": nil,
						},
					},
					&schema.SchemaField{
						Id:          "item",
						Name:        "item",
						Type:        schema.FieldTypeRelation,
						Required:    true,
						Presentable: false,
						Options: types.JsonMap{
							"collectionId":  "items",
							"cascadeDelete": true,
							"minSelect":     nil,
							"maxSelect":     1,
							"displayFields": nil,
						},
					},
					&schema.SchemaField{
						Id:          "meta",
						Name:        "meta",
						Type:        schema.FieldTypeJson,
						Required:    false,
						Presentable: false,
						Options: types.JsonMap{
							"maxSize": 100_000_000, // 100MB
						},
					},
				),
			}

			collection.SetId("viewer_items")

			dao.SaveCollection(collection)
		}

		return nil
	}, nil)
}
