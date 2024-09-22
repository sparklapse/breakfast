package types

import "breakfast/services/viewers"

type Subscription struct {
	Channel Channel         `json:"channel"`
	Chatter Chatter         `json:"chatter"`
	Viewer  *viewers.Viewer `json:"viewer"`
	Gifted  bool            `json:"gifted"`
	Tier    string          `json:"tier"`
}

type GiftedSubscription struct {
	Channel Channel         `json:"channel"`
	Chatter *Chatter        `json:"chatter"`
	Viewer  *viewers.Viewer `json:"viewer"`
	Tier    string          `json:"tier"`
	Total   int             `json:"total"`
}
