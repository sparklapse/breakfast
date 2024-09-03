package subscriptions

import (
	"breakfast/services/events/types"
	"errors"
)

const TypeStreamOffline = "stream.offline"

func CreateStreamOfflineSubscription(twitch_broadcaster_id string) SubscriptionConfig {
	return SubscriptionConfig{
		Type:    TypeStreamOffline,
		Version: "1",
		Condition: map[string]string{
			"broadcaster_user_id": twitch_broadcaster_id,
		},
	}
}

func ProcessStreamOfflinePayload(payload map[string]any) (*types.StreamOffline, error) {
	broadcaster_user_id, valid := payload["broadcaster_user_id"].(string)
	if !valid {
		return nil, errors.New("broadcaster_user_id field was not of the correct type")
	}

	broadcaster_user_login, valid := payload["broadcaster_user_login"].(string)
	if !valid {
		return nil, errors.New("broadcaster_user_login field was not of the correct type")
	}

	broadcaster_user_name, valid := payload["broadcaster_user_name"].(string)
	if !valid {
		return nil, errors.New("broadcaster_user_name field was not of the correct type")
	}

	return &types.StreamOffline{
		Channel: types.User{
			Id:          broadcaster_user_id,
			Username:    broadcaster_user_login,
			DisplayName: broadcaster_user_name,
		},
	}, nil
}
