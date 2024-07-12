package eventsub

type Transport struct {
	Method    string `json:"method"`
	SessionId string `json:"session_id"`
}

func WebsocketTransport(session_id string) Transport {
	return Transport{
		Method:    "websocket",
		SessionId: session_id,
	}
}

type SubscriptionRequest struct {
	Version   string            `json:"version"`
	Type      string            `json:"type"`
	Condition map[string]string `json:"condition"`
	Transport Transport         `json:"transport"`
}

type SubscriptionResponseData struct {
	Id        string            `json:"id"`
	Status    string            `json:"status"`
	Type      string            `json:"type"`
	Version   string            `json:"version"`
	Condition map[string]string `json:"condition"`
	CreatedAt string            `json:"created_at"`
	Transport Transport         `json:"transport"`
	Cost      int               `json:"cost"`
}

type SubscriptionResponse struct {
	Data         []SubscriptionResponseData `json:"data"`
	Total        int                        `json:"total"`
	TotalCost    int                        `json:"total_cost"`
	MaxTotalCost int                        `json:"max_total_cost"`
}

type EventSubMessageMetadata struct {
	MessageId           string `json:"message_id"`
	MessageType         string `json:"message_type"`
	MessageTimestamp    string `json:"message_timestamp"`
	SubscriptionType    string `json:"subscription_type"`
	SubscriptionVersion string `json:"subscription_version"`
}

type EventSubMessage struct {
	Metadata EventSubMessageMetadata `json:"metadata"`
	Payload  map[string]any          `json:"payload"`
}
