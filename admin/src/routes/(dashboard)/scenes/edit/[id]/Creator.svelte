<script lang="ts">
  import type { Point } from "$lib/math";

  export let canCreate = true;

  let isCreating = false;
  let createStart = { x: 0, y: 0 };
  let createEnd = { x: 0, y: 0 };

  export let onselect: ((area: [Point, Point]) => any) | undefined = undefined;

  const onpointerdown = (
    ev: PointerEvent & {
      currentTarget: EventTarget & Window;
    },
  ) => {
    if (!canCreate) return;
    if (ev.buttons !== 1) return;

    createStart = { x: ev.clientX, y: ev.clientY };
    createEnd = { x: ev.clientX, y: ev.clientY };
    isCreating = true;
  };

  const onpointermove = (
    ev: PointerEvent & {
      currentTarget: EventTarget & Window;
    },
  ) => {
    if (!isCreating) return;
    createEnd = { x: ev.clientX, y: ev.clientY };
  };

  const onpointerup = (
    ev: PointerEvent & {
      currentTarget: EventTarget & Window;
    },
  ) => {
    if (!isCreating) return;
    isCreating = false;
    createEnd = { x: ev.clientX, y: ev.clientY };

    onselect?.([
      [Math.min(createStart.x, createEnd.x), Math.min(createStart.y, createEnd.y)],
      [Math.max(createStart.x, createEnd.x), Math.max(createStart.y, createEnd.y)],
    ]);
  };
</script>

<svelte:window
  on:pointerdown={onpointerdown}
  on:pointermove={onpointermove}
  on:pointerup={onpointerup}
/>

{#if isCreating}
  <div
    class="absolute z-50 bg-green-700/25"
    style:left="{Math.min(createStart.x, createEnd.x)}px"
    style:top="{Math.min(createStart.y, createEnd.y)}px"
    style:width="{Math.max(createStart.x, createEnd.x) - Math.min(createStart.x, createEnd.x)}px"
    style:height="{Math.max(createStart.y, createEnd.y) - Math.min(createStart.y, createEnd.y)}px"
  />
{/if}
