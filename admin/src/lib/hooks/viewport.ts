import { derived, get, writable } from "svelte/store";
import { expoOut } from "svelte/easing";
import { select } from "d3-selection";
import { zoom, zoomIdentity } from "d3-zoom";
import { interpolateObject } from "d3-interpolate";
import { timer } from "d3-timer";
import type { Readable } from "svelte/store";
import { getContext, setContext } from "svelte";

type ViewportTransform = { x: number; y: number; k: number };
type AreaTransform = {
  x: number;
  y: number;
  width: number;
  height: number;
  padding?: number;
};

export function createViewport(options?: {
  initialView?: AreaTransform;
  disableMouseControls?: boolean;
}) {
  const transform = writable<ViewportTransform>({ x: 0, y: 0, k: 1 });
  const offset = writable({ x: 0, y: 0 });
  let viewContainer: Element;

  const z = zoom()
    .scaleExtent([0.25, 5])
    .filter((ev: (MouseEvent | WheelEvent) & { target: Element | null }) => {
      if (options?.disableMouseControls) return false;
      if (ev.shiftKey) return false;
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

  const screenToLocal = (position: { x: number; y: number }) => {
    const { x, y } = viewContainer.getBoundingClientRect();

    const t = get(transform);
    const localX = (position.x - x - t.x) / t.k;
    const localY = (position.y - y - t.y) / t.k;

    return {
      x: localX,
      y: localY,
    };
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
      transform: {
        subscribe: transform.subscribe,
      } as Readable<ViewportTransform>,
      offset: {
        subscribe: offset.subscribe,
      } as Readable<{ x: number; y: number }>,
    },
    use: { attachcontainer: attachcontainer },
    utils: { screenToLocal, panTo },
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
