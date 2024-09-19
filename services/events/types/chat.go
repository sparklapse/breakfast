package types

import "breakfast/services/viewers"

type ChatMessageImage struct {
	Url string `json:"url"`
}

type ChatMessageFragment struct {
	Type   string             `json:"type"`
	Text   string             `json:"text"`
	Images []ChatMessageImage `json:"images"`
}

type ChatMessageReply struct {
	RepliedToMessageId string          `json:"repliedToMessageId"`
	RepliedToChatter   Chatter         `json:"repliedToChatter"`
	RepliedToViewer    *viewers.Viewer `json:"repliedToViewer"`
}

type ChatMessage struct {
	Id        string                `json:"id"`
	Channel   Channel               `json:"channel"`
	Chatter   Chatter               `json:"chatter"`
	Viewer    *viewers.Viewer       `json:"viewer"`
	Reply     *ChatMessageReply     `json:"reply"`
	Text      string                `json:"text"`
	Color     string                `json:"color"`
	Fragments []ChatMessageFragment `json:"fragments"`
	Features  []string              `json:"features"`
}

type ChatMessageDelete struct {
	Id string `json:"id"`
}
