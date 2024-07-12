package auth

import (
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/cron"
	"github.com/pocketbase/pocketbase/tools/types"
)

const twitch_job_name = "twitchTokenRefresh"
const twitch_job_cron = "*/5 * * * *"
const twitch_token_url = "https://id.twitch.tv/oauth2/token"

type TwitchRefreshResponse struct {
	AccessToken  string   `json:"access_token"`
	RefreshToken string   `json:"refresh_token"`
	ExpiresIn    int      `json:"expires_in"`
	Scope        []string `json:"scope"`
	TokenType    string   `json:"token_type"`
}

func RefreshExpiredTwitchTokens(app *pocketbase.PocketBase) {
	expired := []struct {
		User         string `db:"user"`
		Identity     string `db:"identity"`
		RefreshToken string `db:"refreshToken"`
	}{}
	in_five_minutes, err := types.ParseDateTime(time.Now().Add(5 * time.Minute))
	if err != nil {
		panic("Unable to create timestamp 5 minutes in the future")
	}

	app.Dao().DB().
		NewQuery("SELECT user, identity, refreshToken FROM tokens WHERE provider = 'twitch' AND expires < {:now}").
		Bind(dbx.Params{
			"now": in_five_minutes.String(),
		}).
		All(&expired)

	settings, err := app.Dao().FindSettings()
	if err != nil {
		app.Logger().Error(
			"JOBS Failed to lookup settings",
			"error", err.Error(),
			"job", twitch_job_name,
			"cron", twitch_job_cron,
		)
		return
	}

	client_id := settings.TwitchAuth.ClientId
	client_secret := settings.TwitchAuth.ClientSecret

	for _, token := range expired {
		request_url := twitch_token_url + "?grant_type=refresh_token&refresh_token=" + token.RefreshToken + "&client_id=" + client_id + "&client_secret=" + client_secret

		resp, err := http.PostForm(request_url, url.Values{})
		if err != nil {
			app.Logger().Error(
				"JOBS Failed to refresh token",
				"error", err.Error(),
				"job", twitch_job_name,
				"cron", twitch_job_cron,
				"user", token.User,
			)
			return
		}

		defer resp.Body.Close()
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			app.Logger().Error(
				"JOBS Failed to read body",
				"error", err.Error(),
				"job", twitch_job_name,
				"cron", twitch_job_cron,
				"user", token.User,
			)
			return
		}

		if resp.StatusCode != 200 {
			app.Logger().Error(
				"JOBS Failed to refresh token",
				"job", twitch_job_name,
				"cron", twitch_job_cron,
				"user", token.User,
				"status", resp.Status,
				"code", resp.StatusCode,
				"response", string(body[:]),
			)
			continue
		}

		var refreshed TwitchRefreshResponse
		{
			err := json.Unmarshal(body, &refreshed)
			if err != nil {
				app.Logger().Error(
					"JOBS Failed to unmarshal refresh response",
					"error", err.Error(),
					"job", twitch_job_name,
					"cron", twitch_job_cron,
					"user", token.User,
					"response", string(body[:]),
				)
				continue
			}
		}

		expiration, err := types.ParseDateTime(time.Now().Add(time.Duration(refreshed.ExpiresIn) * time.Second))
		if err != nil {
			app.Logger().Error(
				"JOBS Failed to parse now token expiration",
				"error", err.Error(),
				"job", twitch_job_name,
				"cron", twitch_job_cron,
				"user", token.User,
			)
			continue
		}

		{
			_, err := app.Dao().DB().
				NewQuery(`
					UPDATE tokens SET accessToken = {:accessToken}, refreshToken = {:refreshToken}, expires = {:expires}
					WHERE user = {:user} AND identity = {:identity}
				`).
				Bind(dbx.Params{
					"user":         token.User,
					"identity":     token.Identity,
					"accessToken":  refreshed.AccessToken,
					"refreshToken": refreshed.RefreshToken,
					"expires":      expiration.String(),
				}).
				Execute()

			if err != nil {
				app.Logger().Error(
					"JOBS Failed to save token record",
					"error", err.Error(),
					"user", token.User,
				)
				continue
			}
		}

		app.Logger().Info(
			"JOBS Refreshed twitch token",
			"user", token.User,
		)
	}
}

func ScheduleTwitchTokenRefresh(e *core.ServeEvent, scheduler *cron.Cron) {
	scheduler.MustAdd(twitch_job_name, twitch_job_cron, func() {
		RefreshExpiredTwitchTokens(e.App.(*pocketbase.PocketBase))
	})
}
