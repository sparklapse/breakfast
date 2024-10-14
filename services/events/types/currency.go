package types

import "breakfast/services/viewers"

type CurrencySpentRedeem struct {
	Id          string `json:"id"`
	Label       string `json:"label"`
	Description string `json:"description"`
	Currency    string `json:"currency"`
	Cost        int    `json:"cost"`
}

/*
Item - the brekkie item that was given with the currency spent
Status - can be unfulfilled, fulfilled, or cancelled
*/
type CurrencySpent struct {
	Id       string              `json:"id"`
	Channel  Channel             `json:"channel"`
	Chatter  Chatter             `json:"chatter"`
	Viewer   *viewers.Viewer     `json:"viewer"`
	Input    string              `json:"input"`
	Redeemed CurrencySpentRedeem `json:"redeemed"`
	Item     *any                `json:"item"`
	Status   string              `json:"status"`
}
