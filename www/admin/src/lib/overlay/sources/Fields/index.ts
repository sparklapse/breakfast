import Text from "./Text.svelte";
import Number from "./Number.svelte";
import type { ComponentType, SvelteComponent } from "svelte";
import type { SourceField } from "$lib/overlay/types";

type FieldProps<V = any> = Omit<SourceField, "type"> & {
  value?: V;
  onchange?: (value: V) => void;
};

export const fields: Record<string, ComponentType<SvelteComponent<FieldProps, any, any>>> = {
  text: Text,
  number: Number,
};
