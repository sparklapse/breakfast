package types

type Subscription struct {
	Channel Channel `json:"channel"`
	Viewer  Viewer  `json:"viewer"`
	Gifted  bool    `json:"gifted"`
	Tier    string  `json:"tier"`
}

type GiftedSubscription struct {
	Channel Channel `json:"channel"`
	Viewer  *Viewer `json:"viewer"`
	Tier    string  `json:"tier"`
	Total   int     `json:"total"`
}
