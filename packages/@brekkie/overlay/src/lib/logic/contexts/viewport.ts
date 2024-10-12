import { getContext, setContext } from "svelte";
import { get, writable } from "svelte/store";
import { expoOut } from "svelte/easing";
import { select } from "d3-selection";
import { zoom, zoomIdentity } from "d3-zoom";
import { interpolateObject } from "d3-interpolate";
import { timer } from "d3-timer";
import type { Readable } from "svelte/store";
import type { Point } from "$lib/logic/math/point.js";

type ViewportTransform = { x: number; y: number; k: number };
type AreaTransform = {
  x: number;
  y: number;
  width: number;
  height: number;
  padding?: number;
};

export function createViewport(options?: { initialView?: AreaTransform }) {
  const transform = writable<ViewportTransform>({ x: 0, y: 0, k: 1 });
  const offset = writable({ x: 0, y: 0 });
  const disableMouseControls = writable(false);
  let viewContainer: Element;

  const z = zoom()
    .scaleExtent([0.25, 5])
    .filter((ev: (MouseEvent | WheelEvent) & { target: Element | null }) => {
      if (
        get(disableMouseControls) &&
        (ev.type.startsWith("mouse") || ev.type.startsWith("touchstart"))
      )
        return false;
      if (ev.type === "dblclick") return false; // Disable double click to zoom

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
      transform.set({ x, y, k });
    });

  const screenToLocal = (position: Point): Point => {
    const { x, y } = viewContainer.getBoundingClientRect();

    const t = get(transform);
    const localX = (position[0] - x - t.x) / t.k;
    const localY = (position[1] - y - t.y) / t.k;

    return [localX, localY];
  };

  const localToScreen = (position: Point): Point => {
    const { x, y } = viewContainer.getBoundingClientRect();

    const t = get(transform);
    const screenX = position[0] * t.k + t.x + x;
    const screenY = position[1] * t.k + t.y + y;

    return [screenX, screenY];
  };

  const setTransformOverTime = async ({ x, y, k }: ViewportTransform, duration: number) => {
    await new Promise<void>((resolve, reject) => {
      const start = structuredClone(get(transform));
      const end = zoomIdentity.translate(x, y).scale(k);
      const i = interpolateObject(start, end);

      const timeout = setTimeout(() => {
        t.stop();
        reject(new Error("fitBounds timed out"));
      }, duration + 100);

      const t = timer((time) => {
        const progress = Math.min(1, time / duration);
        // @ts-ignore - too many types for ts to handle apparently
        select(viewContainer).call(z.transform, i(expoOut(progress)));
        if (progress >= 1) {
          t.stop();
          resolve();
          clearTimeout(timeout);
        }
      });
    });
  };

  const panTo = async ({ padding = 0, ...bounds }, duration?: number) => {
    if (!viewContainer) return;

    const k = Math.min(
      (viewContainer.clientWidth - padding) / bounds.width,
      (viewContainer.clientHeight - padding) / bounds.height,
    );
    const x = viewContainer.clientWidth / 2 - bounds.x * k;
    const y = viewContainer.clientHeight / 2 - bounds.y * k;

    if (duration) await setTransformOverTime!({ x, y, k }, duration);
    // @ts-ignore - too many types for ts to handle apparently
    else select(viewContainer).call(z.transform, zoomIdentity.translate(x, y).scale(k));
  };

  const attachcontainer = (el: Element) => {
    viewContainer = el;

    select(el).call(z);
    const observer = new ResizeObserver(() => {
      const { width, height } = viewContainer.getBoundingClientRect();
      offset.set({
        x: -(width / 2),
        y: -(height / 2),
      });
    });

    observer.observe(viewContainer);

    if (options?.initialView) panTo(options?.initialView);

    return {
      destroy: () => {
        observer.disconnect();
      },
    };
  };

  const ctx = {
    stores: {
      disableMouseControls,
      transform: {
        subscribe: transform.subscribe,
      } as Readable<ViewportTransform>,
      offset: {
        subscribe: offset.subscribe,
      } as Readable<{ x: number; y: number }>,
    },
    use: { attachcontainer },
    utils: { screenToLocal, localToScreen, panTo },
  };

  setContext("viewport", ctx);

  return ctx;
}

export function useViewport(dontCreate?: true) {
  const ctx = getContext<ReturnType<typeof createViewport>>("viewport");
  if (dontCreate && !ctx) throw new Error("Failed to get an existing viewport context");
  if (!ctx) return createViewport();
  else return ctx;
}
