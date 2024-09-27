package emotes

import (
	"breakfast/services"
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/tools/cron"
)

type STVEmote struct {
	Id   string `json:"id"`
	Name string `json:"name"`
	Data struct {
		Id       string `json:"id"`
		Name     string `json:"name"`
		Listed   bool   `json:"listed"`
		Animated bool   `json:"animated"`
		Host     struct {
			Url   string `json:"url"`
			Files []struct {
				Name       string `json:"name"`
				StaticName string `json:"staticName"`
				Width      int    `json:"width"`
				Height     int    `json:"height"`
				FrameCount int    `json:"frameCount"`
				Size       int    `json:"size"`
				Format     string `json:"format"`
			} `json:"files"`
		} `json:"host"`
	} `json:"data"`
}

type STVEmoteSet struct {
	Id     string     `json:"id"`
	Name   string     `json:"name"`
	Emotes []STVEmote `json:"emotes"`
}

type STVUserConnection struct {
	Id            string      `json:"id"`
	Platform      string      `json:"platform"`
	Username      string      `json:"username"`
	DisplayName   string      `json:"display_name"`
	LinkedAt      int         `json:"linked_at"`
	EmoteCapacity int         `json:"emote_capacity"`
	EmoteSet      STVEmoteSet `json:"emote_set"`
}

var stvConnections map[string]STVUserConnection = make(map[string]STVUserConnection, 0)
var stvGlobals *STVEmoteSet

func RefreshSTVGlobalEmotes() error {
	url := "https://7tv.io/v3/emote-sets/global"
	resp, err := http.DefaultClient.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return errors.New("request returned non success status: " + resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	var set STVEmoteSet
	{
		err := json.Unmarshal(body, &set)
		if err != nil {
			return err
		}
	}

	stvGlobals = &set

	return nil
}

func RefreshSTVEmotes(provider string, providerId string) error {
	services.App.Logger().Debug(
		"EMOTES Refreshing emotes",
		"provider", provider,
		"providerId", providerId,
	)

	url := "https://7tv.io/v3/users/" + provider + "/" + providerId
	resp, err := http.DefaultClient.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		services.App.Logger().Debug(
			"EMOTES User does not have stv emotes (or bad url)",
			"provider", provider,
			"providerId", providerId,
		)
		return nil
	}

	if resp.StatusCode != 200 {
		return errors.New("request returned non success status: " + resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	var connection STVUserConnection
	{
		err := json.Unmarshal(body, &connection)
		if err != nil {
			return err
		}
	}

	stvConnections[provider+"-"+providerId] = connection
	services.App.Logger().Debug(
		"EMOTES Refreshed emotes for user",
		"provider", provider,
		"providerId", providerId,
	)

	return nil
}

func GetAllSTVEmotesForTwitch() error {
	var query []struct {
		UserId string `db:"userId"`
	}
	{
		err := services.App.Dao().DB().
			Select("json_extract(tes.config, '$.condition.broadcaster_user_id') as userId").
			Distinct(true).
			From("twitch_event_subscriptions as tes").
			Where(dbx.NewExp("userId IS NOT NULL")).
			All(&query)
		if err != nil {
			services.App.Logger().Error(
				"EMOTES Failed to get distinct twitch subscription users",
				"error", err.Error(),
			)
			return err
		}
	}

	for _, user := range query {
		err := RefreshSTVEmotes("twitch", user.UserId)
		if err != nil {
			services.App.Logger().Error(
				"EMOTES Failed to get emotes for twitch user",
				"twitchId", user.UserId,
				"error", err.Error(),
			)
			continue
		}
	}

	return nil
}

func ScheduleSTVEmoteRefresh(app *pocketbase.PocketBase, scheduler *cron.Cron) {
	scheduler.MustAdd("emotes-refresh-stv", "0 */6 * * *", func() {
		RefreshSTVGlobalEmotes()
		GetAllSTVEmotesForTwitch()
	})
}
