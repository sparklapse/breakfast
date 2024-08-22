package eventsub

type SubscriptionConfig struct {
	Version   string
	Type      string
	Condition map[string]string
}

// Create an array events for most common things users would listen to
func CreateDefaultSubscriptions(twitch_user_id string) []SubscriptionConfig {
	return []SubscriptionConfig{
		CreateChannelChatMessageSubscription(twitch_user_id, twitch_user_id),
		CreateStreamOfflineSubscription(twitch_user_id),
		CreateStreamOnlineSubscription(twitch_user_id),
	}
}

// Broadcaster goes live
const SubscriptionTypeStreamOnline = "stream.online"

func CreateStreamOnlineSubscription(twitch_broadcaster_id string) SubscriptionConfig {
	return SubscriptionConfig{
		Type:    SubscriptionTypeStreamOnline,
		Version: "1",
		Condition: map[string]string{
			"broadcaster_user_id": twitch_broadcaster_id,
		},
	}
}

// Broadcaster goes offline
const SubscriptionTypeStreamOffline = "stream.offline"

func CreateStreamOfflineSubscription(twitch_broadcaster_id string) SubscriptionConfig {
	return SubscriptionConfig{
		Type:    SubscriptionTypeStreamOffline,
		Version: "1",
		Condition: map[string]string{
			"broadcaster_user_id": twitch_broadcaster_id,
		},
	}
}

// Message sent in chat
const SubscriptionTypeChannelChatMessage = "channel.chat.message"

func CreateChannelChatMessageSubscription(twitch_broadcaster_id string, twitch_user_id string) SubscriptionConfig {
	return SubscriptionConfig{
		Type:    SubscriptionTypeChannelChatMessage,
		Version: "1",
		Condition: map[string]string{
			"broadcaster_user_id": twitch_broadcaster_id,
			"user_id":             twitch_user_id,
		},
	}
}

// Broadcaster shouts someone out
const SubscriptionTypeChannelShoutoutCreate = "channel.shoutout.create"

func CreateShoutoutCreateSubscription(twitch_broadcaster_id string, moderator_twitch_id string) SubscriptionConfig {
	return SubscriptionConfig{
		Type:    SubscriptionTypeChannelShoutoutCreate,
		Version: "1",
		Condition: map[string]string{
			"broadcaster_user_id": twitch_broadcaster_id,
			"moderator_user_id":   moderator_twitch_id,
		},
	}
}

// Broadcaster receives a shoutout
const SubscriptionTypeChannelShoutoutReceive = "channel.shoutout.receive"

func CreateShoutoutReceiveSubscription(twitch_broadcaster_id string, moderator_twitch_id string) SubscriptionConfig {
	return SubscriptionConfig{
		Type:    SubscriptionTypeChannelShoutoutReceive,
		Version: "1",
		Condition: map[string]string{
			"broadcaster_user_id": twitch_broadcaster_id,
			"moderator_user_id":   moderator_twitch_id,
		},
	}
}
