package types

type Channel struct {
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
}

type Viewer struct {
	// references id stored in viewers table
	Id          string `json:"id"`
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
}
