import * as Source from "./components/Source";
import type { PluginBuiltin } from "$lib/core";

const obsPlugin: PluginBuiltin = {
  id: "obs",
  version: "1.0.0",
  author: "Sparklapse",
  label: "OBS",
  components: [
    {
      id: "source",
      label: "OBS Source",
      color: 180,
      component: Source.Component,
      editor: Source.Editor,
    },
  ],
  script: "",
  builtin: true,
};

export default obsPlugin;
