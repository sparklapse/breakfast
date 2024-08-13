<script lang="ts" context="module">
  export type ViewportTransform = { x: number; y: number; k: number };
  export type AreaTransform = {
    x: number;
    y: number;
    width: number;
    height: number;
    padding?: number;
  };

  export const DEFAULT_GRID = {
    dotSize: 1,
    spacing: 20,
  };

  export const DEFAULT_VIEW = {
    x: 1920 / 2,
    y: 1080 / 2,
    width: 1920,
    height: 1080,
    padding: 200,
  };

  export const viewport: {
    screenToLocal?: (position: { x: number; y: number }) => { x: number; y: number };
    setTransformOverTime?: (transform: ViewportTransform, duration: number) => Promise<void>;
    /**
     *
     * @param transform
     * @param duration Optional duration in milliseconds to animate to the taregt transform
     */
    panTo?: (transform: AreaTransform, duration?: number) => Promise<void>;
  } = {};
</script>

<script lang="ts">
  import clsx from "clsx";
  import { onMount } from "svelte";
  import { expoOut } from "svelte/easing";
  import { select } from "d3-selection";
  import { zoom, zoomIdentity } from "d3-zoom";
  import { interpolateObject } from "d3-interpolate";
  import { timer } from "d3-timer";

  let classes: string | undefined = "";
  export { classes as class };

  // #region Viewport Settings

  let transform: ViewportTransform = { x: 0, y: 0, k: 1 };
  export let initialView: AreaTransform | undefined = undefined;
  let offset = { x: 0, y: 0 };
  export let disableMouseControls = false;
  let viewContainer: Element;

  const z = zoom()
    .scaleExtent([0.25, 5])
    .filter((ev: (MouseEvent | WheelEvent) & { target: Element | null }) => {
      if (disableMouseControls) return false;
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
      transform = { x, y, k };
    });

  onMount(() => {
    if (initialView) viewport.panTo?.(initialView);

    select(viewContainer).call(z);
    const observer = new ResizeObserver(() => {
      const { width, height } = viewContainer.getBoundingClientRect();
      offset = {
        x: -(width / 2),
        y: -(height / 2),
      };
    });

    observer.observe(viewContainer);

    return () => {
      observer.disconnect();
    };
  });

  // #endregion

  // #region Grid Settings

  export let grid: typeof DEFAULT_GRID | undefined = undefined;
  let rect = { width: 1, height: 1 };
  let gridContainer: SVGElement;

  $: kSize = grid ? grid.dotSize * transform.k : 0;
  $: kSpacing = grid ? grid.spacing * transform.k : 0;
  $: patternX = grid ? transform.x / rect.width : 0;
  $: patternY = grid ? transform.y / rect.height : 0;
  $: patternWidth = grid ? kSpacing / rect.width : 0;
  $: patternHeight = grid ? kSpacing / rect.height : 0;

  onMount(() => {
    const observer = new ResizeObserver(() => {
      const { width, height } = gridContainer.getBoundingClientRect();
      rect = { width, height };
    });

    observer.observe(gridContainer);

    return () => {
      observer.disconnect();
    };
  });

  // #endregion

  // #region Globals

  viewport.screenToLocal = (position) => {
    const { x, y } = viewContainer.getBoundingClientRect();

    const localX = (position.x - x - transform.x) / transform.k;
    const localY = (position.y - y - transform.y) / transform.k;

    return {
      x: localX,
      y: localY,
    };
  };

  viewport.setTransformOverTime = async ({ x, y, k }: ViewportTransform, duration: number) => {
    await new Promise<void>((resolve, reject) => {
      const start = structuredClone(transform);
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

  viewport.panTo = async ({ padding = 0, ...bounds }, duration?: number) => {
    if (!viewContainer) return;

    const k = Math.min(
      (viewContainer.clientWidth - padding) / bounds.width,
      (viewContainer.clientHeight - padding) / bounds.height,
    );
    const x = viewContainer.clientWidth / 2 - bounds.x * k;
    const y = viewContainer.clientHeight / 2 - bounds.y * k;

    if (duration) await viewport.setTransformOverTime!({ x, y, k }, duration);
    else select(viewContainer).call(z.transform, zoomIdentity.translate(x, y).scale(k));
  };

  // #endregion
</script>

<div class={clsx(["relative size-full overflow-hidden", classes])} bind:this={viewContainer}>
  {#if grid}
    <svg
      class="absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      bind:this={gridContainer}
    >
      <defs>
        <pattern
          id="dot-grid"
          x={patternX}
          y={patternY}
          width={patternWidth}
          height={patternHeight}
        >
          <circle r={kSize} fill="currentColor" cx="0" cy="0"></circle>
          <circle r={kSize} fill="currentColor" cx="0" cy={kSpacing}></circle>
          <circle r={kSize} fill="currentColor" cx={kSpacing} cy="0"></circle>
          <circle r={kSize} fill="currentColor" cx={kSpacing} cy={kSpacing}></circle>
        </pattern>
      </defs>
      <rect fill="url(#dot-grid)" width="100%" height="100%" />
    </svg>
  {/if}
  <div
    class="absolute left-1/2 top-1/2 isolate h-0 w-0 touch-none"
    style:transform="translate({offset.x}px,
    {offset.y}px) translate({transform.x}px, {transform.y}px) scale({transform.k})"
  >
    <slot transform />
  </div>
</div>
