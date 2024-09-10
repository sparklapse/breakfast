package apis

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

var twitchClient string
var twitchSecret string

var twitchAppToken string
var twitchAppTokenExpires time.Time

func init() {
	twitchAppTokenExpires = time.Now()
}

func getTwitchSettings() error {
	settings := pb.Settings()

	if !settings.TwitchAuth.Enabled {
		return errors.New("twitch auth not enabled")
	}

	twitchClient = settings.TwitchAuth.ClientId
	twitchSecret = settings.TwitchAuth.ClientSecret

	if twitchClient == "" || twitchSecret == "" {
		return errors.New("twitch auth not configured correctly")
	}

	return nil
}

func refreshToken() error {
	// Token is still valid
	if time.Now().Add(30 * time.Second).Before(twitchAppTokenExpires) {
		return nil
	}

	if twitchClient == "" || twitchSecret == "" {
		err := getTwitchSettings()
		if err != nil {
			return err
		}
	}

	_, err := GetTwitchAppToken(twitchClient, twitchSecret)
	if err != nil {
		return err
	}

	return nil
}

func GetTwitchAppToken(clientId string, clientSecret string) (string, error) {
	response, err := http.PostForm(
		"https://id.twitch.tv/oauth2/token?client_id="+clientId+"&client_secret="+clientSecret+"&grant_type=client_credentials",
		url.Values{},
	)

	if err != nil {
		return "", err
	}
	defer response.Body.Close()

	if response.StatusCode != 200 {
		return "", errors.New("app token request returned error: " + response.Status)
	}

	body, err := io.ReadAll(response.Body)
	if err != nil {
		return "", err
	}

	var token struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
		TokenType   string `json:"token_type"`
	}
	{
		err := json.Unmarshal(body, &token)
		if err != nil {
			return "", err
		}
	}

	twitchAppToken = token.AccessToken
	twitchAppTokenExpires = time.Now().Add(time.Duration(token.ExpiresIn-300) * time.Second)

	return token.AccessToken, nil
}

type TwitchUser struct {
	Id              string `json:"id"`
	Login           string `json:"login"`
	DisplayName     string `json:"display_name"`
	BroadcasterType string `json:"broadcaster_type"`
	Description     string `json:"description"`
	ProfileImageUrl string `json:"profile_image_url"`
	OfflineImageUrl string `json:"offline_image_url"`
	ViewCount       int    `json:"view_count"`
	Email           string `json:"email"`
	CreatedAt       string `json:"created_at"`
}

func GetTwitchUserById(id string) (*TwitchUser, error) {
	{
		err := refreshToken()
		if err != nil {
			return nil, err
		}
	}

	url := "http://api.twitch.tv/helix/users?id=" + id
	req, err := http.NewRequest("POST", url, strings.NewReader(""))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+twitchAppToken)
	req.Header.Set("Client-Id", twitchClient)

	response, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	if response.StatusCode != 200 {
		return nil, errors.New("get user request returned error: " + response.Status)
	}

	body, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	var data struct {
		Data []TwitchUser `json:"data"`
	}
	{
		err := json.Unmarshal(body, &data)
		if err != nil {
			return nil, err
		}
	}

	if len(data.Data) == 0 {
		return nil, errors.New("user not found")
	}

	user := data.Data[0]

	return &user, nil
}

func GetTwitchUserByLogin(login string) (*TwitchUser, error) {
	{
		err := refreshToken()
		if err != nil {
			return nil, err
		}
	}

	url := "http://api.twitch.tv/helix/users?login=" + login
	req, err := http.NewRequest("POST", url, strings.NewReader(""))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+twitchAppToken)
	req.Header.Set("Client-Id", twitchClient)

	response, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	if response.StatusCode != 200 {
		return nil, errors.New("get user request returned error: " + response.Status)
	}

	body, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	var data struct {
		Data []TwitchUser `json:"data"`
	}
	{
		err := json.Unmarshal(body, &data)
		if err != nil {
			return nil, err
		}
	}

	user := data.Data[0]

	return &user, nil
}
