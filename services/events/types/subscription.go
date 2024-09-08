package types

type Subscription struct {
	Channel Channel `json:"channel"`
	Chatter Chatter `json:"chatter"`
	Gifted  bool    `json:"gifted"`
	Tier    string  `json:"tier"`
}

type GiftedSubscription struct {
	Channel Channel  `json:"channel"`
	Chatter *Chatter `json:"chatter"`
	Tier    string   `json:"tier"`
	Total   int      `json:"total"`
}
