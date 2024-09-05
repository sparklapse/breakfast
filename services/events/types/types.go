package types

const EventTypeAction = "action"
const EventTypeChatMessage = "chat-message"
const EventTypeChatMessageDelete = "chat-message-delete"
const EventTypePointsRedeem = "points-redeem"
const EventTypeStreamOffline = "stream-offline"
const EventTypeStreamOnline = "stream-online"
const EventTypeSubscription = "subscription"

var AllEventTypes = []string{
	EventTypeAction,
	EventTypeChatMessage,
	EventTypeChatMessageDelete,
	EventTypePointsRedeem,
	EventTypeStreamOffline,
	EventTypeStreamOnline,
	EventTypeSubscription,
}
var DefaultSavedEventTypes = []string{
	EventTypeAction,
	EventTypePointsRedeem,
	EventTypeStreamOffline,
	EventTypeStreamOnline,
	EventTypeSubscription,
}
