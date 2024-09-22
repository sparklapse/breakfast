package subscriptions

import "breakfast/services/events/types"

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

func ProcessChannelPointsRedeemAddPayload(payload map[string]any) (*types.Redeem, error) {
	return nil, nil
}
