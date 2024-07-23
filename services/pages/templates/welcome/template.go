package welcome

import (
	_ "embed"
)

//go:embed dist/index.html
var Template string
