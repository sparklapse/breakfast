import chat from "./chat.svelte?wcs";
import highlight from "./highlight.svelte?wcs";

import type { Script } from "@sparklapse/breakfast/overlay";

export const basics: Script = {
  id: "basics",
  label: "Basics",
  version: 0,
  script: [chat, highlight].join("\n"),
  sources: [
    {
      label: "Basic Chat",
      subLabel: "Basics",
      tag: "basic-chat",
      inputs: [
        {
          group: [
            {
              type: "number",
              label: "Size",
              target: "style.font-size",
              defaultValue: "42",
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
          group: [
            {
              type: "color",
              label: "Text Color",
              target: "style.color",
              defaultValue: "#000000",
            },
            {
              type: "number",
              label: "Display Time",
              target: "props.removeTime",
              defaultValue: "0",
              options: { min: -1 },
            },
            {
              type: "select",
              label: "Names Source",
              target: "props.names",
              defaultValue: "provider",
              options: {
                options: [
                  { label: "Provider Names", value: "provider" },
                  { label: "Custom Names", value: "custom" },
                ],
              },
            },
          ],
        },
      ],
    },
    {
      label: "Message Highlight",
      subLabel: "Basics",
      tag: "basic-message-highlight",
      inputs: [
        {
          group: [
            {
              type: "select",
              label: "X",
              target: "props.x",
              defaultValue: "left",
              options: {
                options: [
                  { label: "Left", value: "left" },
                  { label: "Center", value: "center" },
                  { label: "Right", value: "right" },
                ],
              },
            },
            {
              type: "select",
              label: "Y",
              target: "props.y",
              defaultValue: "top",
              options: {
                options: [
                  { label: "Top", value: "top" },
                  { label: "Center", value: "center" },
                  { label: "Bottom", value: "bottom" },
                ],
              },
            },
          ],
        },
        {
          group: [
            {
              type: "number",
              label: "Size",
              target: "style.font-size",
              defaultValue: "64",
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
