package types

type StreamOnline struct {
	Id        string `json:"id"`
	Channel   User   `json:"channel"`
	StartedAt string `json:"startedAt"`
}

type StreamOffline struct {
	Channel User `json:"channel"`
}
