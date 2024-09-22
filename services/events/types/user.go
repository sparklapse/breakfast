package types

type Channel struct {
	Id          string `json:"id"`
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
	Platform    string `json:"platform"`
}

type Chatter struct {
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
}
