package eventsub

import (
	"breakfast/services/events/types"
	"errors"
)

func PayloadToStreamOnline(payload map[string]any) (*types.StreamOnline, error) {
	id, valid := payload["id"].(string)
	if !valid {
		return nil, errors.New("id field was not of the correct type")
	}

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

	started_at, valid := payload["started_at"].(string)
	if !valid {
		return nil, errors.New("started_at field was not of the correct type")
	}

	return &types.StreamOnline{
		Id: id,
		Channel: types.User{
			Id:          broadcaster_user_id,
			Username:    broadcaster_user_login,
			DisplayName: broadcaster_user_name,
		},
		StartedAt: started_at,
	}, nil
}

func PayloadToStreamOffline(payload map[string]any) (*types.StreamOffline, error) {
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

func PayloadToChatMessage(payload map[string]any) (*types.ChatMessage, error) {
	event, valid := payload["event"].(map[string]any)
	if !valid {
		return nil, errors.New("event field was not of the correct type")
	}
	message, valid := event["message"].(map[string]any)
	if !valid {
		return nil, errors.New("message field was not of the correct type")
	}
	message_text, valid := message["text"].(string)
	if !valid {
		return nil, errors.New("text field was not of the correct type")
	}
	message_type, valid := event["message_type"].(string)
	if !valid {
		return nil, errors.New("message_type was not of the correct type")
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
	chatter_user_id, valid := event["chatter_user_id"].(string)
	if !valid {
		return nil, errors.New("chatter_user_id was not of the correct type")
	}
	chatter_user_login, valid := event["chatter_user_login"].(string)
	if !valid {
		return nil, errors.New("chatter_user_login was not of the correct type")
	}
	chatter_user_name, valid := event["chatter_user_name"].(string)
	if !valid {
		return nil, errors.New("chatter_user_name was not of the correct type")
	}
	message_id, valid := event["message_id"].(string)
	if !valid {
		return nil, errors.New("message_id was not of the correct type")
	}
	color, valid := event["color"].(string)
	if !valid {
		return nil, errors.New("color was not of the correct type")
	}
	message_fragments, valid := message["fragments"].([]any)
	if !valid {
		return nil, errors.New("fragments field was not of the correct type")
	}

	var chat_fragments []types.ChatMessageFragment
	for _, item := range message_fragments {
		fragment, valid := item.(map[string]any)
		if !valid {
			return nil, errors.New("fragment was not of the correct type")
		}
		fragment_type, valid := fragment["type"].(string)
		if !valid {
			return nil, errors.New("fragment type was not of the correct type")
		}
		text, valid := fragment["text"].(string)
		if !valid {
			return nil, errors.New("fragment text was not of the correct type")
		}

		chat_fragments = append(chat_fragments, types.ChatMessageFragment{
			Type: fragment_type,
			Text: text,
		})
	}

	features := []string{}
	if message_type != "text" {
		features = append(features, message_type)
	}

	var reply *types.ChatMessageReply
	reply_data, valid := event["reply"].(map[string]any)
	if !valid {
		reply = nil
	} else {
		replied_to_message_id, valid := reply_data["parent_message_id"].(string)
		if !valid {
			return nil, errors.New("reply parent_message_id was not of the correct type")
		}
		replied_to_chatter_id, valid := reply_data["parent_user_id"].(string)
		if !valid {
			return nil, errors.New("reply parent_user_id was not of the correct type")
		}
		replied_to_chatter_login, valid := reply_data["parent_user_login"].(string)
		if !valid {
			return nil, errors.New("reply parent_user_login was not of the correct type")
		}
		replied_to_chatter_name, valid := reply_data["parent_user_name"].(string)
		if !valid {
			return nil, errors.New("reply parent_user_name was not of the correct type")
		}

		reply = &types.ChatMessageReply{
			RepliedToMessageId: replied_to_message_id,
			RepliedToChatter: types.User{
				Id:          replied_to_chatter_id,
				Username:    replied_to_chatter_login,
				DisplayName: replied_to_chatter_name,
			},
		}
	}

	return &types.ChatMessage{
		Id:        message_id,
		Text:      message_text,
		Reply:     reply,
		Fragments: chat_fragments,
		Color:     color,
		Channel: types.User{
			Id:          broadcaster_user_id,
			Username:    broadcaster_user_login,
			DisplayName: broadcaster_user_name,
		},
		Chatter: types.User{
			Id:          chatter_user_id,
			Username:    chatter_user_login,
			DisplayName: chatter_user_name,
		},
		Features: features,
		Platform: "twitch",
	}, nil
}
