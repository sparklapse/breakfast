package message

import (
	"breakfast/app"

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

var stvConnections []STVUserConnection = make([]STVUserConnection, 0)

func RefreshSTVEmotes(provider string, providerId string) error {
	return nil
}

func GetAllSTVEmotesForTwitch() error {
	var query []struct {
		UserId string `db:"userId"`
	}
	{
		err := app.App.Dao().DB().
			Select("json_extract(tes.config, '$.condition.broadcaster_user_id') as userId").
			Distinct(true).
			From("twitch_event_subscription as tes").
			Where(dbx.NewExp("userId IS NOT NULL")).
			All(&query)
		if err != nil {
			app.App.Logger().Error(
				"EMOTES Failed to get distinct twitch subscription users",
				"error", err.Error(),
			)
			return err
		}
	}

	for _, user := range query {
		err := RefreshSTVEmotes("twitch", user.UserId)
		if err != nil {
			app.App.Logger().Error(
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
		GetAllSTVEmotesForTwitch()
	})
}
