import Paragraph from "./Paragraph.svelte";
import type { ComponentType } from "svelte";
import type { SourceDef } from "$lib/editor/types";

export const BUILTIN_DEFINITIONS: SourceDef[] = [
  {
    label: "Text",
    subLabel: "Builtin",
    tag: "p",
    fields: [],
  },
];

export const INSPECTORS: Record<string, ComponentType> = {
  p: Paragraph,
};
