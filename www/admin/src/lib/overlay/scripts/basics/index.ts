import script from "./components.js?raw";
import type { Script } from "$lib/overlay/types";

export const basics: Script = {
  id: "basic-chat",
  label: "Basic Chat",
  version: 0,
  components: [
    {
      label: "Basic Chat",
      subLabel: "Basics",
      tag: "basic-chat",
      fields: [
        {
          type: "number",
          label: "Font Size",
        }
      ],
    },
  ],
  script,
};
