package viewers

type Viewer struct {
	Id          string         `json:"id"`
	DisplayName string         `json:"displayName"`
	Currencies  map[string]int `json:"currencies"`
}
