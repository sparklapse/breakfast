package connection

import "errors"

type EventHook func(message *EventSubMessage, subscription *Subscription)

type Subscription struct {
	Id        string
	Type      string
	Version   string
	Condition map[string]string
}

func SubscriptionFromPayload(payload map[string]any) (*Subscription, error) {
	id, ok := payload["id"].(string)
	if !ok {
		return nil, errors.New("id field is not of the correct type")
	}

	subType, ok := payload["type"].(string)
	if !ok {
		return nil, errors.New("type field is not of the correct type")
	}

	version, ok := payload["version"].(string)
	if !ok {
		return nil, errors.New("version field is not of the correct type")
	}

	condition, ok := payload["condition"].(map[string]any)
	if !ok {
		return nil, errors.New("condition field is not of the correct type")
	}

	validCondition := map[string]string{}
	for key, maybe := range condition {
		value, ok := maybe.(string)
		if !ok {
			return nil, errors.New(key + " condition subfield is not of the correct type")
		}
		validCondition[key] = value
	}

	return &Subscription{
		Id:        id,
		Type:      subType,
		Version:   version,
		Condition: validCondition,
	}, nil
}

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
