package types

const BreakfastEventsKey = "@breakfast/events"

type BreakfastEvent struct {
	Type      string `json:"type"`
	Initiator string `json:"initiator"`
	Data      any    `json:"data"`
}
