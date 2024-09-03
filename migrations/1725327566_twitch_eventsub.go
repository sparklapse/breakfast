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
		// Create a new twitchEventSub collection
		{
			dao := daos.New(db)

			collection := &models.Collection{
				Name:       "twitch_event_subscriptions",
				Type:       "base",
				System:     true,
				ListRule:   types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				ViewRule:   types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				CreateRule: nil,
				UpdateRule: nil,
				DeleteRule: nil,
				Indexes: types.JsonArray[string]{
					"CREATE INDEX twitch_event_subscriptions_eventSubId_idx ON twitch_event_subscriptions (eventSubId)",
					"CREATE INDEX twitch_event_subscriptions_authorizer_idx ON twitch_event_subscriptions (authorizer)",
				},
				Options: types.JsonMap{},
				Schema: schema.NewSchema(
					&schema.SchemaField{
						Id:          "eventSubId",
						Name:        "eventSubId",
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
						Id:          "authorizer",
						Name:        "authorizer",
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
						Id:          "config",
						Name:        "config",
						Type:        schema.FieldTypeJson,
						Required:    false,
						Presentable: false,
						Options: types.JsonMap{
							"maxSize": 1_000_000_000, // 1GB
						},
					},
				),
			}

			collection.SetId("twitch_event_subscriptions")

			dao.SaveCollection(collection)
		}

		return nil
	}, nil)
}
