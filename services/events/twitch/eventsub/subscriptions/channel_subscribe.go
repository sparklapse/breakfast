package subscriptions

import (
	"breakfast/services/events/types"
	"breakfast/services/viewers"
	"errors"
)

const TypeChannelSubscribe = "channel.subscribe"

func CreateChannelSubscribeSubscription(broadcasterId string) SubscriptionConfig {
	return SubscriptionConfig{
		Type:    TypeChannelSubscribe,
		Version: "1",
		Condition: map[string]string{
			"broadcaster_user_id": broadcasterId,
		},
	}
}

func ProcessChannelSubscribePayload(payload map[string]any) (*types.Subscription, error) {
	event, ok := payload["event"].(map[string]any)
	if !ok {
		return nil, errors.New("event field was not of the correct type")
	}

	broadcaster_user_login, ok := event["broadcaster_user_login"].(string)
	if !ok {
		return nil, errors.New("broadcaster_user_login field is not of the correct type")
	}

	broadcaster_user_name, ok := event["broadcaster_user_name"].(string)
	if !ok {
		return nil, errors.New("broadcaster_user_name field is not of the correct type")
	}

	user_id, ok := event["user_id"].(string)
	if !ok {
		return nil, errors.New("user_id field was not of the correct type")
	}

	user_login, ok := event["user_login"].(string)
	if !ok {
		return nil, errors.New("user_login field was not of the correct type")
	}

	user_name, ok := event["user_name"].(string)
	if !ok {
		return nil, errors.New("user_name field was not of the correct type")
	}

	tier, ok := event["tier"].(string)
	if !ok {
		return nil, errors.New("tier field was not of the correct type")
	}

	is_gift, ok := event["is_gift"].(bool)
	if !ok {
		return nil, errors.New("is_gift field was not of the correct type")
	}

	viewer, _ := viewers.GetViewerByProviderId("twitch", user_id)

	return &types.Subscription{
		Channel: types.Channel{
			Username:    broadcaster_user_login,
			DisplayName: broadcaster_user_name,
		},
		Chatter: types.Chatter{
			Viewer:      viewer,
			Username:    user_login,
			DisplayName: user_name,
		},
		Gifted: is_gift,
		Tier:   tier,
	}, nil
}
