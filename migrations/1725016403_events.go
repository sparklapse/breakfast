package migrations

import (
	b "breakfast/services/events/types"
	"strings"
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/models/schema"
	"github.com/pocketbase/pocketbase/tools/security"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		// Create saved types setting
		{
			_, err := db.Insert("_params", dbx.Params{
				"id":      security.RandomString(15),
				"key":     "breakfast-events-saved-types",
				"value":   strings.Join(b.DefaultSavedEventTypes, ","),
				"created": time.Now().UTC().Format(types.DefaultDateLayout),
				"updated": time.Now().UTC().Format(types.DefaultDateLayout),
			}).Execute()

			if err != nil {
				return err
			}
		}

		// Create event stored duration setting
		{
			_, err := db.Insert("_params", dbx.Params{
				"id":      security.RandomString(15),
				"key":     "breakfast-events-stored-duration",
				"value":   "72h",
				"created": time.Now().UTC().Format(types.DefaultDateLayout),
				"updated": time.Now().UTC().Format(types.DefaultDateLayout),
			}).Execute()

			if err != nil {
				return err
			}
		}

		// Create a new events collection
		{
			dao := daos.New(db)

			collection := &models.Collection{
				Name:       "events",
				Type:       "base",
				System:     true,
				ListRule:   types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				ViewRule:   types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				CreateRule: types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				UpdateRule: types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				DeleteRule: types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				Indexes: types.JsonArray[string]{
					"CREATE INDEX events_provider_id_idx ON events (providerId, provider)",
				},
				Options: types.JsonMap{},
				Schema: schema.NewSchema(
					&schema.SchemaField{
						Id:          "provider",
						Name:        "provider",
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
						Id:          "providerId",
						Name:        "providerId",
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
						Id:          "type",
						Name:        "type",
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
						Id:          "data",
						Name:        "data",
						Type:        schema.FieldTypeJson,
						Required:    true,
						Presentable: false,
						Options: types.JsonMap{
							"maxSize": 1_000_000_000, // 1GB
						},
					},
				),
			}

			collection.SetId("events")

			dao.SaveCollection(collection)
		}

		return nil
	}, nil)
}
