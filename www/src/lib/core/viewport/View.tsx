import clsx from "clsx";
import { createSignal, onCleanup, onMount } from "solid-js";
import { select } from "d3-selection";
import { zoom, zoomIdentity } from "d3-zoom";
import { interpolateObject } from "d3-interpolate";
import { timer } from "d3-timer";
import { Context } from "./context";
import type { JSX, ParentProps } from "solid-js";
import type { ViewportContext } from "./context";
import type { ViewportTransform } from "./types";
import type { Transform } from "..";

/**
 * Exponential out timing
 */
const timing = (t: number) => (t === 1.0 ? t : 1.0 - Math.pow(2.0, -10.0 * t));

export type ViewportProps = ParentProps & {
  class?: string;
  style?: JSX.CSSProperties,
  before?: JSX.Element;
  after?: JSX.Element;
  zoomMin?: number;
  zoomMax?: number;
  mouseControls?: boolean;
  initialZoom?: Omit<Transform, "angle"> & { padding?: number };
};

export function View(props: ViewportProps) {
  // Signals
  const [mouseControls, _setMouseControls] = createSignal(props.mouseControls);
  const [transform, setTransform] = createSignal<ViewportTransform>({ x: 0, y: 0, k: 1 });
  const [offset, setOffset] = createSignal({ x: 0, y: 0 });

  // References
  let container: Element;

  // Variables
  const z = zoom()
    .scaleExtent([props.zoomMin ?? 0.25, props.zoomMax ?? 5])
    .filter((ev: (MouseEvent | WheelEvent) & { target: Element | null }) => {
      if (mouseControls() === false) return false;
      if (ev.shiftKey) return false;

      const escapePan = ev.target?.closest(".esc-pan");
      const escapeZoom = ev.target?.closest(".esc-zoom");
      if ((ev.type.startsWith("mouse") || ev.type.startsWith("touchstart")) && escapePan)
        return false;
      if (ev.type === "wheel" && escapeZoom) return false;
      if (ev.type === "dblclick" && (escapePan || escapeZoom)) return false;

      return true;
    })
    .on("zoom", (ev) => {
      const { x, y, k } = ev.transform;
      setTransform({ x, y, k });
    });

  // Context
  const setTransformOverTime = async ({ x, y, k }: ViewportTransform, duration: number) => {
    if (!container) return;

    await new Promise<void>((resolve, reject) => {
      const start = structuredClone(transform());
      const end = zoomIdentity.translate(x, y).scale(k);
      const i = interpolateObject(start, end);

      const timeout = setTimeout(() => {
        t.stop();
        reject(new Error("fitBounds timed out"));
      }, duration + 100);

      const t = timer((time) => {
        const progress = Math.min(1, time / duration);
        select(container).call(z.transform, i(timing(progress)));
        if (progress >= 1) {
          t.stop();
          resolve();
          clearTimeout(timeout);
        }
      });
    });
  };

  const panTo = async (
    { padding = 0, ...bounds }: Omit<Transform, "angle"> & { padding?: number },
    duration?: number,
  ) => {
    if (!container) return;

    const k = Math.min(
      (container.clientWidth - padding) / bounds.width,
      (container.clientHeight - padding) / bounds.height,
    );
    const x = container.clientWidth / 2 - bounds.x * k;
    const y = container.clientHeight / 2 - bounds.y * k;

    if (duration) setTransformOverTime({ x, y, k }, duration);
    else select(container).call(z.transform, zoomIdentity.translate(x, y).scale(k));
  };

  const screenToLocal = (position: { x: number; y: number }) => {
    if (container === undefined)
      throw new Error("Cannot convert coordinates to an unmounted viewport");

    const vpTransform = transform();
    const { x, y } = container.getBoundingClientRect();

    const localX = (position.x - x - vpTransform.x) / vpTransform.k;
    const localY = (position.y - y - vpTransform.y) / vpTransform.k;

    return {
      x: localX,
      y: localY,
    };
  };

  const ctx: ViewportContext = {
    transform,
    setTransformOverTime,
    panTo,
    screenToLocal,
  };

  onMount(() => {
    select(container).call(z);
    if (props.initialZoom) panTo(props.initialZoom);

    const observer = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      setOffset({
        x: -(width / 2),
        y: -(height / 2),
      });
    });

    observer.observe(container);

    onCleanup(() => {
      observer.disconnect();
    });
  });

  return (
    <Context.Provider value={ctx}>
      <div
        class={clsx(["relative size-full overflow-hidden", props.class])}
        style={props.style}
        ref={(el) => (container = el)}
        data-viewport-view
      >
        {props.before}
        <div
          class="absolute left-1/2 top-1/2 isolate h-0 w-0 touch-none"
          style={{
            transform: `translate(${transform().x}px, ${transform().y}px) scale(${transform().k})`,
            translate: `${offset().x}px ${offset().y}px`,
          }}
          data-breakfast-viewport
        >
          {props.children}
        </div>
        {props.after}
      </div>
    </Context.Provider>
  );
}
