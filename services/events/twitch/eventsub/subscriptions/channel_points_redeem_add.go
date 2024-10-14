package subscriptions

import (
	"breakfast/services/events/types"
	"breakfast/services/viewers"
	"errors"
)

const TypeChannelPointsRedeemAdd = "channel.channel_points_custom_reward_redemption.add"

func CreateChannelPointsRedeemAddSubscription(twitchBroadcasterId string) SubscriptionConfig {
	return SubscriptionConfig{
		Type:    TypeChannelPointsRedeemAdd,
		Version: "1",
		Condition: map[string]string{
			"broadcaster_user_id": twitchBroadcasterId,
		},
	}
}

func ProcessChannelPointsRedeemAddPayload(payload map[string]any) (*types.CurrencySpent, error) {
	event, valid := payload["event"].(map[string]any)
	if !valid {
		return nil, errors.New("event field was not of the correct type")
	}

	id, valid := event["id"].(string)
	if !valid {
		return nil, errors.New("id was not of the correct type")
	}

	broadcaster_user_id, valid := event["broadcaster_user_id"].(string)
	if !valid {
		return nil, errors.New("broadcaster_user_id was not of the correct type")
	}
	broadcaster_user_login, valid := event["broadcaster_user_login"].(string)
	if !valid {
		return nil, errors.New("broadcaster_user_login was not of the correct type")
	}
	broadcaster_user_name, valid := event["broadcaster_user_name"].(string)
	if !valid {
		return nil, errors.New("broadcaster_user_name was not of the correct type")
	}

	chatter_user_id, valid := event["user_id"].(string)
	if !valid {
		return nil, errors.New("user_id was not of the correct type")
	}
	chatter_user_login, valid := event["user_login"].(string)
	if !valid {
		return nil, errors.New("user_login was not of the correct type")
	}
	chatter_user_name, valid := event["user_name"].(string)
	if !valid {
		return nil, errors.New("user_name was not of the correct type")
	}

	viewer, _ := viewers.GetViewerByProviderId("twitch", chatter_user_id)

	input, valid := event["user_input"].(string)
	if !valid {
		return nil, errors.New("user_input was not of the correct type")
	}

	reward, valid := event["reward"].(map[string]any)
	if !valid {
		return nil, errors.New("reward was not of the correct type")
	}

	redeem_id, valid := reward["id"].(string)
	if !valid {
		return nil, errors.New("id was not of the correct type")
	}
	redeem_label, valid := reward["title"].(string)
	if !valid {
		return nil, errors.New("title was not of the correct type")
	}
	redeem_desc, valid := reward["prompt"].(string)
	if !valid {
		return nil, errors.New("prompt was not of the correct type")
	}
	redeem_cost, valid := reward["cost"].(float64)
	if !valid {
		return nil, errors.New("cost was not of the correct type")
	}

	status, valid := event["status"].(string)
	if !valid {
		return nil, errors.New("status was not of the correct type")
	}

	return &types.CurrencySpent{
		Id: id,
		Channel: types.Channel{
			Id:          broadcaster_user_id,
			Username:    broadcaster_user_login,
			DisplayName: broadcaster_user_name,
		},
		Chatter: types.Chatter{
			Username:    chatter_user_login,
			DisplayName: chatter_user_name,
		},
		Viewer: viewer,
		Input:  input,
		Redeemed: types.CurrencySpentRedeem{
			Id:          redeem_id,
			Label:       redeem_label,
			Description: redeem_desc,
			Currency:    "channel points",
			Cost:        int(redeem_cost),
		},
		Item:   nil,
		Status: status,
	}, nil
}
