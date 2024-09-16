package overlay

import (
	_ "embed"

	"text/template"
)

//go:embed dist/sse.html
var sseTemplateSource string

//go:embed dist/local.html
var localTemplateSource string

var OverlayTemplate *template.Template
var LocalOverlayTemplate *template.Template

func init() {
	OverlayTemplate = template.Must(template.New("overlay").Parse(sseTemplateSource))
	LocalOverlayTemplate = template.Must(template.New("overlay-local").Parse(localTemplateSource))
}

type OverlayTemplateParams struct {
	Title   string
	Styles  string
	Body    string
	Scripts string
}
