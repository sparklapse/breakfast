package eventsub

type SubscriptionConfig struct {
	Version   string
	Type      string
	Condition map[string]string
}

func CreateChannelChatMessageSubscription(twitch_broadcaster_id string, twitch_user_id string) SubscriptionConfig {
	return SubscriptionConfig{
		Type:    "channel.chat.message",
		Version: "1",
		Condition: map[string]string{
			"broadcaster_user_id": twitch_broadcaster_id,
			"user_id":             twitch_user_id,
		},
	}
}

func CreateDefaultSubscriptions(twitch_user_id string) []SubscriptionConfig {
	return []SubscriptionConfig{
		CreateChannelChatMessageSubscription(twitch_user_id, twitch_user_id),
	}
}
