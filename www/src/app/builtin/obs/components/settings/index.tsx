import { Dynamic } from "solid-js/web";
import { ImageSourceSettings } from "./ImageSource";
import { ColorSourceSettings } from "./ColorSource";
import type { JSX } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";

export type SettingsProps = {
  settings: any;
  setSettings: SetStoreFunction<any>;
};

const INPUT_KIND_MAPPINGS: Record<string, (props: SettingsProps) => JSX.Element> = {
  image_source: ImageSourceSettings,
  color_source_v3: ColorSourceSettings,
};

function FallbackSettings() {
  return <p>Nothing here we can configure in brekkie.</p>;
}

export default function (props: { kind: string } & SettingsProps) {
  return (
    <>
      <p class="font-bold">Source Settings</p>
      <Dynamic
        component={INPUT_KIND_MAPPINGS[props.kind] ?? FallbackSettings}
        settings={props.settings}
        setSettings={props.setSettings}
      />
    </>
  );
}
