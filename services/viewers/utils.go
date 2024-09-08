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

func CreateViewerByProviderId(provider string, id string) (*Viewer, error) {
	viewer := Viewer{}

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
		currencies := map[string]int{
			"dots": 5,
		}
		viewerRecord.Set("wallet", currencies)

		viewer.Id = viewerRecord.Id
		viewer.Currencies = currencies

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

	return &viewer, nil
}

func GetViewerByProviderId(provider string, providerId string) (*Viewer, error) {
	stored, cached := idCache.Get(provider + "-" + providerId)
	if cached {
		if id, ok := stored.(*Viewer); ok {
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
		viewer, err := CreateViewerByProviderId(provider, providerId)
		if err != nil {
			return nil, err
		}

		idCache.SetDefault(provider+"-"+providerId, viewer)
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

		idCache.SetDefault(provider+"-"+providerId, id)
		return id, nil
	} else if err != nil {
		return nil, err
	}

	var currencies map[string]int
	{
		err := viewerRecord.UnmarshalJSONField("wallet", &currencies)
		if err != nil {
			pb.Logger().Error(
				"VIEWERS Failed to get currencies from record",
				"type", err.Error(),
			)
			currencies = map[string]int{}
		}
	}

	viewer := &Viewer{
		Id:          viewerRecord.Id,
		DisplayName: viewerRecord.GetString("displayName"),
		Currencies:  currencies,
	}

	idCache.SetDefault(provider+"-"+providerId, viewerRecord.Id)
	return viewer, nil
}
