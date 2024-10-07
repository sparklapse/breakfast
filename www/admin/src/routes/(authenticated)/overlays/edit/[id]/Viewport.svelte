<script lang="ts" context="module">
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
</script>

<script lang="ts">
  import clsx from "clsx";
  import { onMount } from "svelte";
  import { useViewport } from "@sparklapse/breakfast/overlay";

  const {
    stores: { transform, offset },
    use: { attachcontainer },
  } = useViewport();

  let classes: string | undefined = "";
  export { classes as class };

  // #region Grid Settings

  export let grid: typeof DEFAULT_GRID | undefined = undefined;
  let rect = { width: 1, height: 1 };
  let gridContainer: SVGElement;

  $: kSize = grid ? grid.dotSize * $transform.k : 0;
  $: kSpacing = grid ? grid.spacing * $transform.k : 0;
  $: patternX = grid ? $transform.x / rect.width : 0;
  $: patternY = grid ? $transform.y / rect.height : 0;
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
</script>

<div
  class={clsx(["relative size-full overflow-hidden", classes])}
  use:attachcontainer
>
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
    style:transform="translate({$offset.x}px,
    {$offset.y}px) translate({$transform.x}px, {$transform.y}px) scale({$transform.k})"
  >
    <slot transform />
  </div>
</div>
