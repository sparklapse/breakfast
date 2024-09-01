package viewers

import (
	"breakfast/services/apis"
	"database/sql"
	"errors"
	"time"

	"github.com/patrickmn/go-cache"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/tools/security"
)

var idCache *cache.Cache

func init() {
	idCache = cache.New(24*time.Hour, 48*time.Hour)
}

func CreateViewerByProviderId(provider string, id string) (string, error) {
	viewerId := ""
	err := pb.Dao().RunInTransaction(func(txDao *daos.Dao) error {
		collection, err := txDao.FindCollectionByNameOrId("viewers")
		if err != nil {
			return err
		}
		viewer := models.NewRecord(collection)
		viewer.MarkAsNew()
		viewer.RefreshId()
		viewer.SetUsername(security.RandomStringWithAlphabet(21, "abcdefghijklmnopqrstuvwxyz"))
		viewer.Set("inventory", map[string]any{
			"currencies": map[string]int{
				"dots": 5,
			},
			"items": []map[string]any{},
		})
		viewerId = viewer.Id

		switch provider {
		case "twitch":
			user, err := apis.GetTwitchUserById(id)
			if err != nil {
				return err
			}
			viewer.Set("displayName", user.DisplayName)
		default:
			pb.Logger().Warn("VIEWERS A viewer was created with an unknown provider")
		}

		{
			err := txDao.SaveRecord(viewer)
			if err != nil {
				return err
			}
		}

		external := models.ExternalAuth{
			Provider:     provider,
			ProviderId:   id,
			CollectionId: "viewers",
			RecordId:     viewer.Id,
		}
		external.MarkAsNew()
		external.RefreshId()
		external.RefreshCreated()
		external.RefreshUpdated()

		{
			err := txDao.SaveExternalAuth(&external)
			if err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return "", err
	}

	return viewerId, nil
}

func GetViewerIdByProviderId(provider string, providerId string) (string, error) {
	stored, cached := idCache.Get(provider + "-" + providerId)
	if cached {
		if id, ok := stored.(string); ok {
			return id, nil
		}
	}

	external, err := pb.Dao().FindFirstExternalAuthByExpr(
		dbx.NewExp(
			"collectionId = 'viewers' AND provider = {:provider} AND providerId = {:providerId}",
			dbx.Params{
				"provider":   provider,
				"providerId": providerId,
			},
		),
	)
	if errors.Is(err, sql.ErrNoRows) {
		id, err := CreateViewerByProviderId(provider, providerId)
		if err != nil {
			return "", err
		}

		idCache.SetDefault(provider+"-"+providerId, id)
		return id, nil
	} else if err != nil {
		return "", err
	}

	viewer, err := pb.Dao().FindRecordById("viewers", external.RecordId)
	if errors.Is(err, sql.ErrNoRows) {
		pb.Dao().DeleteExternalAuth(external)
		id, err := CreateViewerByProviderId(provider, providerId)
		if err != nil {
			return "", err
		}

		idCache.SetDefault(provider+"-"+providerId, id)
		return id, nil
	} else if err != nil {
		return "", err
	}

	idCache.SetDefault(provider+"-"+providerId, viewer.Id)
	return viewer.Id, nil
}
