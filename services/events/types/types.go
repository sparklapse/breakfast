package types

const EventTypeAction = "action"
const EventTypeChatMessage = "chat-message"
const EventTypeChatMessageDelete = "chat-message-delete"
const EventTypeCurrencySpent = "currency-spent"
const EventTypeStreamOffline = "stream-offline"
const EventTypeStreamOnline = "stream-online"
const EventTypeSubscription = "subscription"

var AllEventTypes = []string{
	EventTypeAction,
	EventTypeChatMessage,
	EventTypeChatMessageDelete,
	EventTypeCurrencySpent,
	EventTypeStreamOffline,
	EventTypeStreamOnline,
	EventTypeSubscription,
}
var DefaultSavedEventTypes = []string{
	EventTypeAction,
	EventTypeCurrencySpent,
	EventTypeStreamOffline,
	EventTypeStreamOnline,
	EventTypeSubscription,
}
