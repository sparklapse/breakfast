import { Dynamic } from "solid-js/web";
import { ColorSourceVisualizer } from "./ColorSource";
import type { JSX } from "solid-js";

export type VisualizeProps = {
  label: string;
  settings: any;
};

const VISUALIZER_MAPPINGS: Record<string, (props: VisualizeProps) => JSX.Element> = {
  color_source_v3: ColorSourceVisualizer,
};

export function DefaultVisual(props: VisualizeProps) {
  return (
    <div class="absolute inset-0 grid place-content-center bg-black/25">
      <div>
        <p class="text-lg text-white">OBS {props.label} Source</p>
      </div>
    </div>
  );
}

export function Visualize(props: VisualizeProps & { kind: string }) {
  return (
    <Dynamic
      component={VISUALIZER_MAPPINGS[props.kind ?? ""] ?? DefaultVisual}
      label={props.label}
      settings={props.settings}
    />
  );
}
