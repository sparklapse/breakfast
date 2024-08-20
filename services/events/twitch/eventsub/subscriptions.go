package eventsub

type SubscriptionConfig struct {
	Version   string
	Type      string
	Condition map[string]string
}

// Broadcaster goes live
func CreateStreamOnlineSubscription(twitch_broadcaster_id string) SubscriptionConfig {
	return SubscriptionConfig{
		Type:    "stream.online",
		Version: "1",
		Condition: map[string]string{
			"broadcaster_user_id": twitch_broadcaster_id,
		},
	}
}

// Broadcaster goes offline
func CreateStreamOfflineSubscription(twitch_broadcaster_id string) SubscriptionConfig {
	return SubscriptionConfig{
		Type:    "stream.offline",
		Version: "1",
		Condition: map[string]string{
			"broadcaster_user_id": twitch_broadcaster_id,
		},
	}
}

// Message sent in chat
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

// Broadcaster shouts someone out
func CreateShoutoutCreateSubscription(twitch_broadcaster_id string, moderator_twitch_id string) SubscriptionConfig {
	return SubscriptionConfig{
		Type:    "channel.shoutout.create",
		Version: "1",
		Condition: map[string]string{
			"broadcaster_user_id": twitch_broadcaster_id,
			"moderator_user_id":   moderator_twitch_id,
		},
	}
}

// Broadcaster receives a shoutout
func CreateShoutoutReceiveSubscription(twitch_broadcaster_id string, moderator_twitch_id string) SubscriptionConfig {
	return SubscriptionConfig{
		Type:    "channel.shoutout.receive",
		Version: "1",
		Condition: map[string]string{
			"broadcaster_user_id": twitch_broadcaster_id,
			"moderator_user_id":   moderator_twitch_id,
		},
	}
}

// Create an array events for most common things users would listen to
func CreateDefaultSubscriptions(twitch_user_id string) []SubscriptionConfig {
	return []SubscriptionConfig{
		CreateChannelChatMessageSubscription(twitch_user_id, twitch_user_id),
	}
}
