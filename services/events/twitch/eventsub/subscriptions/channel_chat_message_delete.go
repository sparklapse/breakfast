package subscriptions

import (
	"breakfast/services/events/types"
	"errors"
)

const TypeChannelChatMessageDelete = "channel.chat.message_delete"

func CreateChannelChatMessageDeleteSubscription(broadcasterUserId string, userId string) SubscriptionConfig {
	return SubscriptionConfig{
		Type:    TypeChannelChatMessageDelete,
		Version: "1",
		Condition: map[string]string{
			"broadcaster_user_id": broadcasterUserId,
			"user_id":             userId,
		},
	}
}

func ProcessChannelChatMessageDeletePayload(payload map[string]any) (*types.ChatMessageDelete, error) {
	event, ok := payload["event"].(map[string]any)
	if !ok {
		return nil, errors.New("event field is not of the correct type")
	}

	message_id, ok := event["message_id"].(string)
	if !ok {
		return nil, errors.New("message_id field is not of the correct type")
	}

	return &types.ChatMessageDelete{
		Id: message_id,
	}, nil
}
