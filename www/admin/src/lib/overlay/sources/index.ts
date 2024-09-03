import Paragraph from "./Paragraph.svelte";
import Image from "./Image.svelte";

import type { ComponentType } from "svelte";
import type { SourceDefinition } from "@sparklapse/breakfast/scripts";

export const BUILTIN_DEFINITIONS: SourceDefinition[] = [
  {
    label: "Text",
    subLabel: "Builtin",
    tag: "p",
    fields: [],
  },
  {
    label: "Image",
    subLabel: "Builtin",
    tag: "img",
    fields: [],
  },
];

export const INSPECTORS: Record<string, ComponentType> = {
  p: Paragraph,
  img: Image,
};
