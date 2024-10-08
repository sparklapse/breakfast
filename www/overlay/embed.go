package overlay

import (
	_ "embed"

	"text/template"
)

//go:embed dist/index.html
var sseTemplateSource string
var OverlayTemplate *template.Template

func init() {
	OverlayTemplate = template.Must(template.New("overlay").Parse(sseTemplateSource))
}

type OverlayTemplateParams struct {
	Title   string
	Styles  string
	Body    string
	Scripts string
}
