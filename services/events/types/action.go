package types

type Action struct {
	Type   string          `json:"type"`
	Emit   string          `json:"emit"`
	Inputs map[string]any  `json:"inputs"`
	Event  *BreakfastEvent `json:"event"`
}
