package viewers

import (
	"github.com/pocketbase/pocketbase"
)

var pb *pocketbase.PocketBase

func RegisterService(app *pocketbase.PocketBase) {
	pb = app
}
