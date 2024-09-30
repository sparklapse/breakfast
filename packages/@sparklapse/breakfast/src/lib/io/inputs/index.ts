import Text from "./Text.svelte";
import Number from "./Number.svelte";
import Select from "./Select.svelte";
import ColorPicker from "./ColorPicker.svelte";
import AssetPicker from "./AssetPicker.svelte";
import type { ComponentType, SvelteComponent } from "svelte";

type InputProps = {
  label?: string;
  value?: any;
  options?: Record<string, any>;
  onchange?: (value: any) => void;
};

export const INPUT_EDITORS = {
  text: Text,
  number: Number,
  select: Select,
  color: ColorPicker,
  asset: AssetPicker,
} satisfies Record<string, ComponentType<SvelteComponent<InputProps, any, any>>>;

export { Text, Number, Select, ColorPicker };
