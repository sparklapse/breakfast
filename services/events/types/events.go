package types

const BreakfastEventsKey = "@breakfast/events"

type BreakfastEvent struct {
	Type string `json:"type"`
	Data any    `json:"data"`
}
