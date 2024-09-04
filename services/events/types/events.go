package types

const BreakfastEventsKey = "@breakfast/events"

type BreakfastEvent struct {
	Id       *string `json:"id"`
	Type     string  `json:"type"`
	Platform string  `json:"platform"`
	Data     any     `json:"data"`
}
