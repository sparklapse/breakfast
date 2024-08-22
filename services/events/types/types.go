package types

const EventTypeChatMessage = "chat-message"
const EventTypePointsRedeem = "points-redeem"
const EventTypeStreamOffline = "stream-offline"
const EventTypeStreamOnline = "stream-online"

var AllEventTypes = []string{
	EventTypeChatMessage,
	EventTypePointsRedeem,
	EventTypeStreamOffline,
	EventTypeStreamOnline,
}
var DefaultSavedEventTypes = []string{
	EventTypePointsRedeem,
	EventTypeStreamOffline,
	EventTypeStreamOnline,
}
