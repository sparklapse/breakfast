import type { SourceDefinition } from "$lib/overlay/types/script.js";

export const BUILTIN_DEFINITIONS: SourceDefinition[] = [
  {
    label: "Text",
    subLabel: "Builtin",
    tag: "p",
    inputs: [
      {
        type: "text",
        label: "Text",
        target: "children",
        defaultValue: "Hello world!",
        options: { multiline: true },
      },
      {
        group: [
          {
            type: "color",
            label: "Color",
            target: "style.color",
            defaultValue: "#2A2A2A",
          },
          {
            type: "select",
            label: "Align",
            target: "style.text-align",
            options: {
              options: [
                { label: "Left", value: "left" },
                { label: "Center", value: "center" },
                { label: "Right", value: "right" },
              ],
            },
          },
          {
            type: "number",
            label: "Size",
            target: "style.font-size",
            defaultValue: "42",
            format: "{}px",
            options: { min: 1 },
          },
        ],
      },
      {
        group: [
          {
            type: "text",
            label: "Font Family",
            target: "style.font-family",
          },
          {
            type: "number",
            label: "Weight",
            target: "style.font-weight",
            options: { min: 0, step: 0, max: 1000 },
          },
        ],
      },
    ],
  },
  {
    label: "Image",
    subLabel: "Builtin",
    tag: "img",
    inputs: [
      // {
      //   type: "asset",
      //   label: "Image",
      //   target: "props.src",
      // },
      {
        group: [
          {
            type: "select",
            label: "Fitting",
            target: "style.object-fit",
            options: {
              options: [
                { label: "Contain", value: "contain" },
                { label: "Cover", value: "cover" },
                { label: "Fill", value: "fill" },
                { label: "Scale Down", value: "scale-down" },
              ],
            },
          },
          {
            type: "text",
            label: "CSS Filter",
            target: "style.filter",
          },
        ],
      },
    ],
  },
  {
    label: "Rectangle",
    subLabel: "Builtin",
    tag: "div",
    inputs: [
      {
        group: [
          {
            type: "color",
            label: "Color",
            target: "style.background-color",
            defaultValue: "#ffaabb",
          },
          {
            type: "number",
            label: "Opacity",
            target: "style.opacity",
            defaultValue: "1",
            options: { min: 0, step: 0.01, max: 1 },
          },
        ],
      },
    ],
  },
];
