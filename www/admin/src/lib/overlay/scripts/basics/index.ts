import chat from "./chat.svelte?wcs";
import highlight from "./highlight.svelte?wcs";
import type { OverlayScript } from "@sparklapse/breakfast/scripts";

export const basics: OverlayScript = {
  id: "basic-chat",
  label: "Basic Chat",
  version: 0,
  script: `${chat}\n${highlight}`,
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
            {
              type: "select",
              label: "Overflow",
              target: "props.overflow",
              options: {
                options: [
                  {
                    label: "Overflow",
                    value: "overflow",
                  },
                  {
                    label: "Clip",
                    value: "clip",
                  },
                ],
              },
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
    {
      label: "Message Highlight",
      subLabel: "Basics",
      tag: "basic-message-highlight",
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
      ],
    },
  ],
  actions: [
    {
      type: "on-event",
      emit: "message-highlight",
      label: "Highlight Message",
      subLabel: "Show a message on screen to discuss",
      filter: ["chat-message"],
    },
    {
      type: "trigger",
      emit: "message-highlight-clear",
      label: "Clear Highlighted Message",
      subLabel: "Clear the highlighted message from screen",
    },
  ],
};
