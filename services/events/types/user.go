package types

import "breakfast/services/viewers"

type Channel struct {
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
}

type Chatter struct {
	Viewer      *viewers.Viewer `json:"viewer"`
	Username    string          `json:"username"`
	DisplayName string          `json:"displayName"`
}
