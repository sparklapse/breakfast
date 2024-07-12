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
		// Delete and cleanup existing pb collection
		{
			_, err := db.NewQuery("DROP TABLE IF EXISTS users").Execute()
			if err != nil {
				return err
			}
		}

		{
			_, err := db.NewQuery("DELETE FROM _collections WHERE name = 'users'").Execute()
			if err != nil {
				return err
			}
		}

		// Create a new users collection
		{
			dao := daos.New(db)

			collection := &models.Collection{
				Name:       "users",
				Type:       "auth",
				System:     true,
				ListRule:   types.Pointer("id = @request.auth.id"),
				ViewRule:   types.Pointer("id = @request.auth.id"),
				CreateRule: nil,
				UpdateRule: nil,
				DeleteRule: types.Pointer("id = @request.auth.id"),
				Indexes: types.JsonArray[string]{
					"CREATE UNIQUE INDEX users_streamKey_idx ON users (streamKey)",
				},
				Options: types.JsonMap{
					"allowEmailAuth":     false,
					"allowOAuth2Auth":    true,
					"allowUsernameAuth":  true,
					"exceptEmailDomains": nil,
					"manageRule":         nil,
					"minPasswordLength":  8,
					"onlyEmailDomains":   nil,
					"onlyVerified":       true,
					"requireEmail":       false,
				},
				Schema: schema.NewSchema(
					&schema.SchemaField{
						Id:          "streamKey",
						Name:        "streamKey",
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

			collection.SetId("users")

			dao.SaveCollection(collection)
		}

		return nil
	}, nil)
}
