package www

import (
	_ "embed"
)

//go:embed build/pages/welcome.html
var welcomeTemplate string

var Templates = map[string]string{
	"welcome": welcomeTemplate,
}
