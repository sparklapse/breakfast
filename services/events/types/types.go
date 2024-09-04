package types

const EventTypeChatMessage = "chat-message"
const EventTypePointsRedeem = "points-redeem"
const EventTypeStreamOffline = "stream-offline"
const EventTypeStreamOnline = "stream-online"
const EventTypeSubscription = "subscription"

var AllEventTypes = []string{
	EventTypeChatMessage,
	EventTypePointsRedeem,
	EventTypeStreamOffline,
	EventTypeStreamOnline,
	EventTypeSubscription,
}
var DefaultSavedEventTypes = []string{
	EventTypePointsRedeem,
	EventTypeStreamOffline,
	EventTypeStreamOnline,
	EventTypeSubscription,
}
