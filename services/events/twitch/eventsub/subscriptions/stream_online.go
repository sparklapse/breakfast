package subscriptions

import (
	"breakfast/services/events/types"
	"errors"
)

const TypeStreamOnline = "stream.online"

func CreateStreamOnlineSubscription(twitch_broadcaster_id string) SubscriptionConfig {
	return SubscriptionConfig{
		Type:    TypeStreamOnline,
		Version: "1",
		Condition: map[string]string{
			"broadcaster_user_id": twitch_broadcaster_id,
		},
	}
}

func ProcessStreamOnlinePayload(payload map[string]any) (*types.StreamOnline, error) {
	event, ok := payload["event"].(map[string]any)
	if !ok {
		return nil, errors.New("event field was not of the correct type")
	}

	broadcaster_user_id, valid := payload["broadcaster_user_id"].(string)
	if !valid {
		return nil, errors.New("broadcaster_user_id field was not of the correct type")
	}

	broadcaster_user_login, valid := event["broadcaster_user_login"].(string)
	if !valid {
		return nil, errors.New("broadcaster_user_login field was not of the correct type")
	}

	broadcaster_user_name, valid := event["broadcaster_user_name"].(string)
	if !valid {
		return nil, errors.New("broadcaster_user_name field was not of the correct type")
	}

	return &types.StreamOnline{
		Channel: types.Channel{
			Id:          broadcaster_user_id,
			Username:    broadcaster_user_login,
			DisplayName: broadcaster_user_name,
			Platform:    "twitch",
		},
	}, nil
}
