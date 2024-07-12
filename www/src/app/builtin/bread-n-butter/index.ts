import type { PluginBuiltin } from "$lib/core";

import * as Text from "./components/Text";
import * as Polygon from "./components/Polygon";
import * as Rectangle from "./components/Rectangle";
import * as DotGrid from "./components/DotGrid";

const bnbPlugin: PluginBuiltin = {
  id: "bread-n-butter",
  label: "Bead n Butter",
  version: "1.0.0",
  author: "Sparklapse",
  components: [
    {
      id: "text",
      label: "Text",
      component: Text.Component,
      editor: Text.Editor,
    },
    {
      id: "polygon",
      label: "Polygon",
      component: Polygon.Component,
      editor: Polygon.Editor,
    },
    {
      id: "rectangle",
      label: "Rectangle",
      component: Rectangle.Component,
      editor: Rectangle.Editor,
    },
    {
      id: "dot-grid",
      label: "Dot Grid",
      component: DotGrid.Component,
      editor: DotGrid.Editor,
    },
  ],
  builtin: true,
  script: "",
};

export default bnbPlugin;
