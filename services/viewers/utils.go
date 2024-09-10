package viewers

import (
	"breakfast/services/apis"
	"database/sql"
	"errors"
	"time"

	"github.com/patrickmn/go-cache"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/daos"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/tools/security"
)

var viewerCache *cache.Cache

func init() {
	viewerCache = cache.New(24*time.Hour, 48*time.Hour)
}

func CreateViewerByProviderId(provider string, id string) (*Viewer, error) {
	viewer := Viewer{}

	// Create user and external auth records
	err := pb.Dao().RunInTransaction(func(txDao *daos.Dao) error {
		collection, err := txDao.FindCollectionByNameOrId("viewers")
		if err != nil {
			return err
		}

		viewerRecord := models.NewRecord(collection)
		viewerRecord.MarkAsNew()
		viewerRecord.RefreshId()
		viewerRecord.RefreshTokenKey()
		viewerRecord.SetUsername(security.RandomStringWithAlphabet(21, "abcdefghijklmnopqrstuvwxyz"))
		viewerRecord.SetVerified(true)
		wallet := map[string]int{
			"dots": 5,
		}
		viewerRecord.Set("wallet", wallet)

		viewer.Id = viewerRecord.Id
		viewer.Wallet = wallet

		switch provider {
		case "twitch":
			user, err := apis.GetTwitchUserById(id)
			if err != nil {
				return err
			}
			viewerRecord.Set("displayName", user.DisplayName)
			viewer.DisplayName = user.DisplayName
		default:
			pb.Logger().Warn("VIEWERS A viewer was created with an unknown provider")
		}

		{
			err := txDao.SaveRecord(viewerRecord)
			if err != nil {
				return err
			}
		}

		external := models.ExternalAuth{
			Provider:     provider,
			ProviderId:   id,
			CollectionId: "viewers",
			RecordId:     viewerRecord.Id,
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
		return nil, err
	}

	// Give user default profile base item
	if defaultProfileBaseItemId != "" {
		go func() {
			_, err := pb.Dao().DB().
				Insert(
					"viewer_items",
					dbx.Params{
						"id":      security.RandomString(15),
						"owner":   viewer.Id,
						"item":    defaultProfileBaseItemId,
						"meta":    nil,
						"created": time.Now(),
						"updated": time.Now(),
					},
				).
				Execute()

			if err != nil {
				pb.Logger().Error(
					"ITEMS Failed to give user default profile base item",
					"error", err.Error(),
				)
			}
		}()
	}

	return &viewer, nil
}

func GetViewerByProviderId(provider string, providerId string) (*Viewer, error) {
	stored, cached := viewerCache.Get(provider + "-" + providerId)
	if cached {
		if viewer, ok := stored.(*Viewer); ok {
			return viewer, nil
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
		viewer, err := CreateViewerByProviderId(provider, providerId)
		if err != nil {
			return nil, err
		}

		viewerCache.SetDefault(provider+"-"+providerId, viewer)
		return viewer, nil
	} else if err != nil {
		return nil, err
	}

	viewerRecord, err := pb.Dao().FindRecordById("viewers", external.RecordId)
	if errors.Is(err, sql.ErrNoRows) {
		pb.Dao().DeleteExternalAuth(external)
		id, err := CreateViewerByProviderId(provider, providerId)
		if err != nil {
			return nil, err
		}

		viewerCache.SetDefault(provider+"-"+providerId, id)
		return id, nil
	} else if err != nil {
		return nil, err
	}

	var wallet map[string]int
	{
		err := viewerRecord.UnmarshalJSONField("wallet", &wallet)
		if err != nil {
			pb.Logger().Error(
				"VIEWERS Failed to get currencies from record",
				"type", err.Error(),
			)
			wallet = map[string]int{}
		}
	}

	viewer := &Viewer{
		Id:          viewerRecord.Id,
		DisplayName: viewerRecord.GetString("displayName"),
		Wallet:      wallet,
	}

	viewerCache.SetDefault(provider+"-"+providerId, viewerRecord.Id)
	return viewer, nil
}

func registerCacheInvalidation(app *pocketbase.PocketBase) {
	app.OnRecordBeforeDeleteRequest("viewers").Add(func(e *core.RecordDeleteEvent) error {
		if _, exists := viewerCache.Get(e.Record.Id); exists {
			viewerCache.Delete(e.Record.Id)
		}

		return nil
	})
}
