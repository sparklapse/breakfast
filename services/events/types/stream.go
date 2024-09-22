package types

type StreamOnline struct {
	Channel Channel `json:"channel"`
}

type StreamOffline struct {
	Channel Channel `json:"channel"`
}
