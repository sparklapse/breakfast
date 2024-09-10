package viewers

type Viewer struct {
	Id          string         `json:"id"`
	DisplayName string         `json:"displayName"`
	Wallet      map[string]int `json:"wallet"`
}
