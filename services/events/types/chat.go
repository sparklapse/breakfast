package types

type ChatMessageFragment struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

type ChatMessageReply struct {
	RepliedToMessageId string `json:"repliedToMessageId"`
	RepliedToChatter   User   `json:"repliedToChatter"`
}

type ChatMessage struct {
	Id        string                `json:"id"`
	Channel   User                  `json:"channel"`
	Chatter   User                  `json:"chatter"`
	Reply     *ChatMessageReply     `json:"reply"`
	Text      string                `json:"text"`
	Color     string                `json:"color"`
	Fragments []ChatMessageFragment `json:"fragments"`
	Features  []string              `json:"features"`
	Platform  string                `json:"platform"`
}

type ChatMessageDelete struct {
	Id string `json:"id"`
}
