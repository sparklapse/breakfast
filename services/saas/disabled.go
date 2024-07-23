//go:build !saas

package saas

import (
	"github.com/pocketbase/pocketbase"
)

func RegisterService(app *pocketbase.PocketBase) {
	// no-op
}
