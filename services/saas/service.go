package saas

import (
	"github.com/pocketbase/pocketbase"
)

func RegisterService(app *pocketbase.PocketBase) {
	registerSetup(app)
	registerSetupAPIs(app)
	registerRemote(app)
}
