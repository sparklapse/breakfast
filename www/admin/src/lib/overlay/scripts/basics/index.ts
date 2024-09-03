import chat from "./chat.svelte?wcs";
import type { OverlayScript } from "@sparklapse/breakfast/scripts";

export const basics: OverlayScript = {
  id: "basic-chat",
  label: "Basic Chat",
  version: 0,
  script: `${chat}\n`,
  sources: [
    {
      label: "Basic Chat",
      subLabel: "Basics",
      tag: "basic-chat",
      fields: [
        {
          group: [
            {
              type: "number",
              label: "Size",
              target: "style.font-size",
              format: "{}px",
            },
            {
              type: "number",
              label: "Weight",
              target: "style.font-weight",
              options: { min: 100, step: 100, max: 1000 },
            },
          ],
        },
        {
          type: "number",
          label: "Display Time",
          target: "props.removeTime",
          options: { min: 0 },
        },
      ],
    },
  ],
};
