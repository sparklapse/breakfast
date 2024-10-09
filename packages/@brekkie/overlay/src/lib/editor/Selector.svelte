<script lang="ts">
  import type { Point } from "$lib/logic/math/point.js";

  export let canSelect = true;

  let isSelecting = false;
  let selectStart = { x: 0, y: 0 };
  let selectEnd = { x: 0, y: 0 };

  export let onselect: ((area: [Point, Point]) => any) | undefined = undefined;

  export let ondeselect: (() => any) | undefined = undefined;

  const onpointerdown = (
    ev: PointerEvent & {
      currentTarget: EventTarget & Window;
    },
  ) => {
    if (!canSelect) return;
    if (ev.buttons !== 1) return;
    selectStart = { x: ev.clientX, y: ev.clientY };
    selectEnd = { x: ev.clientX, y: ev.clientY };

    isSelecting = true;
  };

  const onpointermove = (
    ev: PointerEvent & {
      currentTarget: EventTarget & Window;
    },
  ) => {
    if (!isSelecting) return;
    selectEnd = { x: ev.clientX, y: ev.clientY };
  };

  const onpointerup = (
    ev: PointerEvent & {
      currentTarget: EventTarget & Window;
    },
  ) => {
    selectEnd = { x: ev.clientX, y: ev.clientY };
    const xDelta = selectEnd.x - selectStart.x;
    const yDelta = selectEnd.y - selectStart.y;
    const delta = Math.abs(Math.sqrt(xDelta * xDelta + yDelta * yDelta));
    if (delta < 10) {
      ondeselect?.();
      isSelecting = false;
      return;
    }

    if (!isSelecting) return;
    isSelecting = false;

    onselect?.([
      [Math.min(selectStart.x, selectEnd.x), Math.min(selectStart.y, selectEnd.y)],
      [Math.max(selectStart.x, selectEnd.x), Math.max(selectStart.y, selectEnd.y)],
    ]);
  };
</script>

<svelte:window
  on:pointerdown={onpointerdown}
  on:pointermove={onpointermove}
  on:pointerup={onpointerup}
/>

{#if isSelecting}
  <div
    class="absolute z-50 bg-slate-700/25"
    style:left="{Math.min(selectStart.x, selectEnd.x)}px"
    style:top="{Math.min(selectStart.y, selectEnd.y)}px"
    style:width="{Math.max(selectStart.x, selectEnd.x) - Math.min(selectStart.x, selectEnd.x)}px"
    style:height="{Math.max(selectStart.y, selectEnd.y) - Math.min(selectStart.y, selectEnd.y)}px"
  />
{/if}
