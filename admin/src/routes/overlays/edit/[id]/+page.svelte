<script lang="ts">
  import { Maximize } from "lucide-svelte";
  import Viewport, { DEFAULT_GRID, DEFAULT_VIEW, viewport } from "./Viewport.svelte";
  import Selector from "./Selector.svelte";
  import clsx from "clsx";

  type Point = { x: number; y: number };
  type Transform = Point & { width: number; height: number; rotation: number };

  const sources = [
    {
      tag: "some-html",
      transform: {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
      },
      props: {},
      children: [],
    },
    {
      tag: "some-html",
      transform: {
        x: 200,
        y: 200,
        width: 100,
        height: 100,
        rotation: 45,
      },
      props: {},
      children: [],
    },
  ];
  let highlightedSources: number[] = [];

  function getBounds(...transforms: Transform[]): Transform {
    const tl: Point = {
      x: Infinity,
      y: Infinity,
    };
    const br: Point = {
      x: -Infinity,
      y: -Infinity,
    };

    for (const transform of transforms) {
      const { x, y, width, height, rotation } = transform;
      const rad = (rotation * Math.PI) / 180;
      const corners: Point[] = [
        { x: 0, y: 0 }, // Top-left
        { x: width, y: 0 }, // Top-right
        { x: 0, y: height }, // Bottom-right
        { x: width, y: height }, // Bottom-left
      ];

      for (let i = 0; i < corners.length; i++) {
        const rotatedX =
          (corners[i].x - width / 2) * Math.cos(rad) - (corners[i].y - height / 2) * Math.sin(rad);
        const rotatedY =
          (corners[i].x - width / 2) * Math.sin(rad) + (corners[i].y - height / 2) * Math.cos(rad);

        corners[i].x = rotatedX;
        corners[i].y = rotatedY;

        corners[i].x += x + width / 2;
        corners[i].y += y + height / 2;
      }

      for (const point of corners) {
        if (point.x < tl.x) tl.x = point.x;
        if (point.x > br.x) br.x = point.x;
        if (point.y < tl.y) tl.y = point.y;
        if (point.y > br.y) br.y = point.y;
      }
    }

    return {
      x: tl.x,
      y: tl.y,
      width: br.x - tl.x,
      height: br.y - tl.y,
      rotation: 0,
    };
  }

  $: sourceBounds = sources.map((s) => getBounds(s.transform));
  $: highlightedSourcesBounds =
    highlightedSources.length > 0
      ? getBounds(...highlightedSources.map((i) => sources[i].transform))
      : undefined;

  const onselect = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => {
    const start = viewport.screenToLocal!({ x: x1, y: y1 });
    const end = viewport.screenToLocal!({ x: x2, y: y2 });

    highlightedSources = [];

    for (let i = 0; i < sources.length; i++) {
      if (
        sourceBounds[i].x > start.x &&
        sourceBounds[i].y > start.y &&
        sourceBounds[i].x + sourceBounds[i].width < end.x &&
        sourceBounds[i].y + sourceBounds[i].width < end.y
      ) {
        highlightedSources.push(i);
      }
    }

    highlightedSources = [...highlightedSources];
  };
</script>

<div class="absolute inset-0">
  <Viewport class="text-slate-700" grid={DEFAULT_GRID} initialView={DEFAULT_VIEW}>
    <div
      class="pointer-events-none absolute h-[1080px] w-[1920px] rounded-[1px] outline outline-slate-700"
    />
    <!-- Debug source transforms -->
    {#each sources as source, idx}
      <div
        class={clsx([
          "absolute bg-red-500/50",
          highlightedSources.includes(idx) && "animate-pulse",
        ])}
        style:left="{source.transform.x}px"
        style:top="{source.transform.y}px"
        style:width="{source.transform.width}px"
        style:height="{source.transform.height}px"
        style:transform="rotate({source.transform.rotation}deg)"
      />
    {/each}
    <!-- Debug source bounds transforms -->
    {#each sourceBounds as source}
      <div
        class="absolute bg-green-500/25"
        style:left="{source.x}px"
        style:top="{source.y}px"
        style:width="{source.width}px"
        style:height="{source.height}px"
        style:transform="rotate({source.rotation}deg)"
      />
    {/each}
    {#if highlightedSourcesBounds}
      <div
        class="absolute bg-blue-500/25"
        style:left="{highlightedSourcesBounds.x}px"
        style:top="{highlightedSourcesBounds.y}px"
        style:width="{highlightedSourcesBounds.width}px"
        style:height="{highlightedSourcesBounds.height}px"
        style:transform="rotate({highlightedSourcesBounds.rotation}deg)"
      />
    {/if}
  </Viewport>
  <div class="absolute bottom-4 right-4">
    <button
      class="rounded border border-slate-200 bg-white p-2 shadow"
      on:click={() => viewport.panTo?.(DEFAULT_VIEW, 500)}
    >
      <Maximize />
    </button>
  </div>
  <Selector
    {onselect}
    ondeselect={() => {
      highlightedSources = [];
    }}
  />
</div>
