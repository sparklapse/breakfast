//go:build !remote

package remote

import (
	"github.com/pocketbase/pocketbase"
)

func RegisterService(app *pocketbase.PocketBase) {
	// no-op
}
