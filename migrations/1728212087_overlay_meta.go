package migrations

import (
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/models/schema"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		// Add meta field to overlays collection
		{
			dao := daos.New(db)

			col, err := dao.FindCollectionByNameOrId("overlays")
			if err != nil {
				return err
			}

			col.Schema.AddField(&schema.SchemaField{
				Id:          "meta",
				Name:        "meta",
				Type:        schema.FieldTypeJson,
				Required:    false,
				Presentable: false,
				Options: types.JsonMap{
					"maxSize": 100_000_000, // 100MB
				},
			})

			{
				err := dao.SaveCollection(col)
				if err != nil {
					return err
				}
			}
		}

		return nil
	}, nil)
}
