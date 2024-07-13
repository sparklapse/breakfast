package tokens

import (
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

func StoreTokenResponse(app *pocketbase.PocketBase, e *core.RecordAuthWithOAuth2Event) error {
	var identity struct {
		Id string
	}
	{
		err := app.Dao().DB().
			NewQuery("SELECT id FROM _externalAuths WHERE collectionId = 'users' AND recordId = {:id} AND provider = {:provider}").
			Bind(dbx.Params{
				"id":       e.Record.Id,
				"provider": e.ProviderName,
			}).
			One(&identity)
		if err != nil {
			return err
		}
	}

	{
		_, err := app.Dao().DB().
			NewQuery(`
				INSERT OR REPLACE INTO tokens (user, identity, provider, accessToken, refreshToken, expires)
				VALUES ({:user}, {:identity}, {:provider}, {:accessToken}, {:refreshToken}, {:expires})
			`).
			Bind(dbx.Params{
				"user":         e.Record.Id,
				"identity":     identity.Id,
				"provider":     e.ProviderName,
				"accessToken":  e.OAuth2User.AccessToken,
				"refreshToken": e.OAuth2User.RefreshToken,
				"expires":      e.OAuth2User.Expiry.String(),
			}).
			Execute()

		if err != nil {
			return err
		}
	}

	return nil
}
