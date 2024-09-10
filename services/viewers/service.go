package viewers

import (
	"github.com/pocketbase/pocketbase"
)

var pb *pocketbase.PocketBase

func RegisterService(app *pocketbase.PocketBase) {
	pb = app

	registerManageAPIs(app)
	registerStatAPIs(app)
	registerItemsService(app)
	registerProfileAPIs(app)
	registerCacheInvalidation(app)
}
