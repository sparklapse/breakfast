package types

type ChatMessageFragment struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

type ChatMessageReply struct {
	RepliedToMessageId string `json:"repliedToMessageId"`
	RepliedToViewer    Viewer `json:"repliedToViewer"`
}

type ChatMessage struct {
	Id        string                `json:"id"`
	Channel   Channel               `json:"channel"`
	Viewer    Viewer                `json:"viewer"`
	Reply     *ChatMessageReply     `json:"reply"`
	Text      string                `json:"text"`
	Color     string                `json:"color"`
	Fragments []ChatMessageFragment `json:"fragments"`
	Features  []string              `json:"features"`
}

type ChatMessageDelete struct {
	Id string `json:"id"`
}
