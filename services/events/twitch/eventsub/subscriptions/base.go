package subscriptions

type SubscriptionConfig struct {
	Version   string            `json:"version"`
	Type      string            `json:"type"`
	Condition map[string]string `json:"condition"`
}

func CreateDefaultSubscriptions(twitchUserId string) []SubscriptionConfig {
	return []SubscriptionConfig{
		CreateChannelChatMessageSubscription(twitchUserId, twitchUserId),
		CreateChannelSubscribeSubscription(twitchUserId),
		CreateStreamOfflineSubscription(twitchUserId),
		CreateStreamOnlineSubscription(twitchUserId),
	}
}
