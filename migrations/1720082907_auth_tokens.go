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
		{
			_, err := db.NewQuery(`
				CREATE TABLE tokens (
					user TEXT,
					identity TEXT,
					provider TEXT,
					accessToken TEXT,
					refreshToken TEXT,
					expires TEXT,
					FOREIGN KEY (user) REFERENCES users (id) ON DELETE CASCADE,
					FOREIGN KEY (identity) REFERENCES _externalAuths (id) ON DELETE CASCADE,
					PRIMARY KEY (user, identity)
				);
				CREATE INDEX tokens_user_provider_idx ON tokens (user, provider);
			`).Execute()

			if err != nil {
				return err
			}
		}

		{
			dao := daos.New(db)

			collection := &models.Collection{
				Name:       "v_tokens",
				Type:       models.CollectionTypeView,
				System:     true,
				ListRule:   nil,
				ViewRule:   nil,
				CreateRule: nil,
				UpdateRule: nil,
				DeleteRule: nil,
				Indexes:    types.JsonArray[string]{},
				Options: types.JsonMap{
					"query": "SELECT (user || '-' || identity) AS id, users.username, tokens.provider, tokens.expires FROM tokens JOIN users ON tokens.user = users.id",
				},
				Schema: schema.NewSchema(
					&schema.SchemaField{
						Id:          "provider",
						Name:        "provider",
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
						Id:          "username",
						Name:        "username",
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
						Id:          "expires",
						Name:        "expires",
						Type:        schema.FieldTypeDate,
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

			collection.SetId("v_tokens")

			{
				err := dao.SaveCollection(collection)
				if err != nil {
					return err
				}
			}
		}

		return nil
	}, nil)
}
