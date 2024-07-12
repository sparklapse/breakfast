import clsx from "clsx";
import { createSignal, onCleanup, onMount } from "solid-js";
import { useViewport } from "./context";

export type GridProps = {
  class?: string;
  color?: string;
  spacing?: number;
  size?: number;
};

export function Grid(props: GridProps) {
  const vp = useViewport();
  if (!vp) throw new Error("Viewport Grid must be a child of a Viewport View");

  const [rect, setRect] = createSignal({ width: 1, height: 1 });

  const kSize = () => (props.size ?? 1) * vp.transform().k;
  const kSpacing = () => (props.spacing ?? 20) * vp.transform().k;
  const patternX = () => vp.transform().x / rect().width;
  const patternY = () => vp.transform().y / rect().height;
  const patternWidth = () => kSpacing() / rect().width;
  const patternHeight = () => kSpacing() / rect().height;

  let element: SVGElement;

  onMount(() => {
    const update = () => {
      const { width, height } = element.getBoundingClientRect();
      setRect({ width, height });
    };

    const observer = new ResizeObserver(update);
    observer.observe(element);

    update();
    onCleanup(() => {
      observer.disconnect();
    });
  });

  return (
    <svg
      class={clsx(["absolute inset-0 h-full w-full", props.class])}
      xmlns="http://www.w3.org/2000/svg"
      ref={(el) => (element = el)}
    >
      <defs>
        <pattern
          id="dot-grid"
          x={patternX()}
          y={patternY()}
          width={patternWidth()}
          height={patternHeight()}
        >
          <circle r={kSize()} fill={props.color ?? "white"} cx="0" cy="0"></circle>
          <circle r={kSize()} fill={props.color ?? "white"} cx="0" cy={kSpacing()}></circle>
          <circle r={kSize()} fill={props.color ?? "white"} cx={kSpacing()} cy="0"></circle>
          <circle
            r={kSize()}
            fill={props.color ?? "white"}
            cx={kSpacing()}
            cy={kSpacing()}
          ></circle>
        </pattern>
      </defs>
      <rect fill="url(#dot-grid)" width="100%" height="100%" />
    </svg>
  );
}
