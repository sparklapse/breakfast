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
		// Create a new viewers collection
		{
			dao := daos.New(db)

			collection := &models.Collection{
				Name:       "viewers",
				Type:       "auth",
				System:     true,
				ListRule:   types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				ViewRule:   types.Pointer(""),
				CreateRule: types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				UpdateRule: types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				DeleteRule: types.Pointer("@request.auth.verified = true && @request.auth.collectionName = \"users\""),
				Indexes: types.JsonArray[string]{
					"CREATE INDEX viewers_provider_providerId_idx ON viewers (provider, providerId)",
				},
				Options: types.JsonMap{
					"allowEmailAuth":     false,
					"allowOAuth2Auth":    true,
					"allowUsernameAuth":  false,
					"exceptEmailDomains": nil,
					"manageRule":         "@request.auth.verified = true && @request.auth.collectionName = \"users\"",
					"minPasswordLength":  8,
					"onlyEmailDomains":   nil,
					"onlyVerified":       false,
					"requireEmail":       false,
				},
				Schema: schema.NewSchema(
					&schema.SchemaField{
						Id:          "displayName",
						Name:        "displayName",
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
						Id:          "inventory",
						Name:        "inventory",
						Type:        schema.FieldTypeJson,
						Required:    false,
						Presentable: false,
						Options: types.JsonMap{
							"maxSize": 1_000_000_000, // 1GB
						},
					},
				),
			}

			collection.SetId("viewers")

			dao.SaveCollection(collection)
		}

		return nil
	}, nil)
}
