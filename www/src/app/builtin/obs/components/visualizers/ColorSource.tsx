import Color from "color";
import type { VisualizeProps } from ".";

export function ColorSourceVisualizer(props: VisualizeProps) {
  return (
    <div
      class="absolute inset-0"
      style={{
        "background-color":
          typeof props.settings.color === "number"
            ? Color(props.settings.color).hex()
            : "#00000055",
      }}
    />
  );
}
