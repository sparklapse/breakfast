package overlays

import (
	"github.com/pocketbase/pocketbase"
)

func RegisterService(app *pocketbase.PocketBase) {
	registerTemplateAPIs(app)
}
