<script lang="ts">
  let isSelecting = false;
  let selectStart = { x: 0, y: 0 };
  let selectEnd = { x: 0, y: 0 };

  export let onselect:
    | ((area: { x1: number; y1: number; x2: number; y2: number }) => void | Promise<void>)
    | undefined = undefined;

  const onpointerdown = (
    ev: PointerEvent & {
      currentTarget: EventTarget & Window;
    },
  ) => {
    if (ev.buttons !== 1) return;
    if (!ev.shiftKey) return;
    isSelecting = true;
    selectStart = { x: ev.clientX, y: ev.clientY };
    selectEnd = { x: ev.clientX, y: ev.clientY };
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
    if (!isSelecting) return;
    isSelecting = false;

    onselect?.({
      x1: Math.min(selectStart.x, selectEnd.x),
      y1: Math.min(selectStart.y, selectEnd.y),
      x2: Math.max(selectStart.x, selectEnd.x),
      y2: Math.max(selectStart.y, selectEnd.y),
    });
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
