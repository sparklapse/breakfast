package localoverlay

import (
	_ "embed"

	"text/template"
)

//go:embed dist/index.html
var sseTemplateSource string
var LocalOverlayTemplate *template.Template

func init() {
	LocalOverlayTemplate = template.Must(template.New("overlay-local").Parse(sseTemplateSource))
}

// Refer to breakfast/www/overlay for params
