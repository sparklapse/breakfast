package types

import "breakfast/services/viewers"

type RedeemItem struct {
	Id          string `json:"id"`
	Label       string `json:"label"`
	Description string `json:"description"`
	Cost        int    `json:"cost"`
}

type Redeem struct {
	Id      string          `json:"id"`
	Channel Channel         `json:"channel"`
	Chatter Chatter         `json:"chatter"`
	Viewer  *viewers.Viewer `json:"viewer"`
	Item    RedeemItem      `json:"item"`
	Input   string          `json:"input"`
	// unfulfilled, fulfilled, or cancelled
	Status     string `json:"status"`
	RedeemedAt string `json:"redeemedAt"`
}
