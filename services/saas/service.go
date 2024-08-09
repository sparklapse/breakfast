package saas

import (
	"github.com/pocketbase/pocketbase"
)

type User struct {
	Id           string `db:"id"`
	Username     string `db:"username"`
	PasswordHash string `db:"passwordHash"`
}

func RegisterService(app *pocketbase.PocketBase) {
	registerSetup(app)
	registerRemote(app)
}
