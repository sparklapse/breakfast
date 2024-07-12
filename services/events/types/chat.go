package types

type ChatMessageUser struct {
	Id          string `json:"id"`
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
}

type ChatMessageFragment struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

type ChatMessageReply struct {
	RepliedToMessageId string          `json:"repliedToMessageId"`
	RepliedToChatter   ChatMessageUser `json:"repliedToChatter"`
}

type ChatMessage struct {
	Id        string                `json:"id"`
	Channel   ChatMessageUser       `json:"channel"`
	Chatter   ChatMessageUser       `json:"chatter"`
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
