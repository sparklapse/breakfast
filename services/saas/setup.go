package saas

import (
	"breakfast/services/apis"
	"database/sql"
	"encoding/json"
	"errors"
	"os"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/tools/security"
)

type RemoteConfig struct {
	Secret string `json:"secret"`
}

type AdminConfig struct {
	Password string `json:"password"`
}

type OwnerConfig struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type TwitchConfig struct {
	ClientId     string `json:"clientId"`
	ClientSecret string `json:"clientSecret"`
}

type BreakfastConfig struct {
	Remote RemoteConfig `json:"remote"`
	Admin  AdminConfig  `json:"admin"`
	Owner  OwnerConfig  `json:"owner"`
	Twitch TwitchConfig `json:"twitch"`
	Url    string       `json:"url"`
}

var config BreakfastConfig

func init() {
	data, err := os.ReadFile("breakfast.json")
	if err == nil {
		{
			err := json.Unmarshal(data, &config)
			if err != nil {
				println("breakfast.json provided but failed to parse: " + err.Error())
				os.Exit(1)
			}
		}
	}

	// URL config
	{
		if config.Url == "" {
			url, ok := os.LookupEnv("BREAKFAST_APP_URL")
			if ok && url != "" {
				config.Url = url
			} else {
				config.Url = "http://localhost:8090"
			}
		}
	}

	// Remote config
	{
		if config.Remote.Secret == "" {
			secret, ok := os.LookupEnv("BREAKFAST_REMOTE_SECRET")
			if ok && secret != "" {
				config.Remote.Secret = secret
			}
		}
	}

	// Admin config
	{
		if config.Admin.Password == "" {
			pass, ok := os.LookupEnv("BREAKFAST_ADMIN_PASSWORD")
			if ok && pass != "" {
				config.Admin.Password = pass
			} else {
				config.Admin.Password = security.RandomString(21)
				println("No admin password was provided so a random one will be generated")
			}
		}
	}

	// Auto User Setup
	{
		if config.Owner.Username == "" {
			username, ok := os.LookupEnv("BREAKFAST_PRE_SETUP")
			if ok && username != "" {
				config.Owner.Username = username
			}
		}
	}

	// Twitch section config
	{

		if config.Twitch.ClientId == "" {
			envClientId, exists := os.LookupEnv("BREAKFAST_TWITCH_CLIENT_ID")
			if !exists {
				println("No twitch clientId was provided")
				os.Exit(1)
			}
			config.Twitch.ClientId = envClientId
		}

		if config.Twitch.ClientSecret == "" {
			envClientSecret, exists := os.LookupEnv("BREAKFAST_TWITCH_CLIENT_SECRET")
			if !exists {
				println("No twitch clientSecret was provided")
				os.Exit(0)
			}
			config.Twitch.ClientSecret = envClientSecret
		}

		_, err := apis.GetTwitchAppToken(
			config.Twitch.ClientId,
			config.Twitch.ClientSecret,
		)
		if err != nil {
			println("Failed to use twitch credentials: " + err.Error())
			os.Exit(1)
		}
	}
}

func registerSetup(app *pocketbase.PocketBase) {
	app.OnBeforeServe().PreAdd(func(e *core.ServeEvent) error {
		// Admin user
		admin, err := app.Dao().FindAdminById("superuser")
		if err != nil {
			if !errors.Is(err, sql.ErrNoRows) {
				return err
			}

			admin = &models.Admin{}
			admin.SetId("superuser")
			admin.Email = "nu@ll.dev"

			app.Logger().Debug("Created superuser")
		}

		if config.Admin.Password != "" && !admin.ValidatePassword(config.Admin.Password) {
			app.Logger().Info("superuser set with the password: " + config.Admin.Password)
			admin.SetPassword(config.Admin.Password)
		}

		{
			err := app.Dao().SaveAdmin(admin)
			if err != nil {
				return err
			}
		}

		// Owner username
		if config.Owner.Username != "" {
			owner, err := app.Dao().FindRecordById("users", "owner")
			if err != nil {
				if !errors.Is(err, sql.ErrNoRows) {
					return err
				}

				collection, err := app.Dao().FindCollectionByNameOrId("users")
				if err != nil {
					return err
				}

				owner = models.NewRecord(collection)
				owner.SetId("owner")
				owner.SetPassword("breakfast")
				owner.Set("streamKey", security.RandomString(21))
				owner.SetVerified(true)
			}

			{
				err := owner.SetUsername(config.Owner.Username)
				if err != nil {
					return err
				}
			}

			{
				err := app.Dao().SaveRecord(owner)
				if err != nil {
					return err
				}
			}
		}

		// Owner password
		if config.Owner.Password != "" {
			owner, err := app.Dao().FindRecordById("users", "owner")
			if err != nil {
				return errors.Join(errors.New("configuring an owner password must already have an existing owner or a username must also be provided"), err)
			}

			if !owner.ValidatePassword(config.Owner.Password) {
				err := owner.SetPassword(config.Owner.Password)
				if err != nil {
					return err
				}
			}

			{
				err := app.Dao().SaveRecord(owner)
				if err != nil {
					return err
				}
			}
		}

		// Settings
		settings, err := app.Dao().FindSettings()
		if err != nil {
			return err
		}

		// Base URL
		if config.Url != "" {
			settings.Meta.AppUrl = config.Url
		}

		// Twitch settings
		settings.TwitchAuth.Enabled = true
		settings.TwitchAuth.ClientId = config.Twitch.ClientId
		settings.TwitchAuth.ClientSecret = config.Twitch.ClientSecret

		{
			err := app.Dao().SaveSettings(settings)
			if err != nil {
				return err
			}
		}

		return nil
	})
}
