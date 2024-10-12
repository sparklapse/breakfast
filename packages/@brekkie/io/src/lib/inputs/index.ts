import Text from "./Text.svelte";
import Number from "./Number.svelte";
import Select from "./Select.svelte";
import ColorPicker from "./ColorPicker.svelte";
import AssetPicker from "./AssetPicker.svelte";

export const INPUT_EDITORS = {
  text: Text,
  number: Number,
  select: Select,
  color: ColorPicker,
  asset: AssetPicker,
};

export { Text, Number, Select, ColorPicker };
