<script lang="ts">
  import Fuse from "fuse.js";
  import { scale } from "svelte/transition";
  import { useEditor, useViewport } from "$lib/editor/contexts";
  import { avgPoints, transformFromPoints } from "$lib/math";
  import { sourceId } from "$lib/editor/naming";
  import type { Point } from "$lib/math";
  import type { Source } from "$lib/editor/types";

  const {
    utils: { screenToLocal },
  } = useViewport();
  const {
    sources: { definitions },
  } = useEditor();

  export let canCreate = true;

  let isCreating = false;
  let createStart: Point = [0, 0];
  let createEnd: Point = [0, 0];
  let showCreateMenu = false;
  let search = "";
  const fuse = new Fuse($definitions, {
    keys: [
      { name: "label", weight: 4 },
      { name: "subLabel", weight: 2 },
      { name: "tag", weight: 1 },
    ],
  });
  $: if ($definitions) fuse.setCollection($definitions);
  $: filteredSourceTypes = search ? fuse.search(search).map((r) => r.item) : $definitions;

  $: if (!canCreate) {
    isCreating = false;
    showCreateMenu = false;
  }

  export let oncreate: ((source: Source) => any) | undefined = undefined;

  const onpointerdown = (
    ev: PointerEvent & {
      currentTarget: EventTarget & Window;
    },
  ) => {
    if (!canCreate) return;
    if (ev.buttons !== 1) return;

    createStart = [ev.clientX, ev.clientY];
    createEnd = [ev.clientX, ev.clientY];
    isCreating = true;
    showCreateMenu = false;
  };

  const onpointermove = (
    ev: PointerEvent & {
      currentTarget: EventTarget & Window;
    },
  ) => {
    if (!isCreating) return;
    createEnd = [ev.clientX, ev.clientY];
  };

  const onpointerup = (
    ev: PointerEvent & {
      currentTarget: EventTarget & Window;
    },
  ) => {
    if (!isCreating) return;
    isCreating = false;
    createEnd = [ev.clientX, ev.clientY];
    const xDelta = createEnd[0] - createStart[0];
    const yDelta = createEnd[1] - createStart[1];
    const delta = Math.abs(Math.sqrt(xDelta * xDelta + yDelta * yDelta));
    if (delta < 10) return;

    showCreateMenu = true;
  };

  const create = (tag?: string) => {
    const viewportStart = screenToLocal([
      Math.min(createStart[0], createEnd[0]),
      Math.min(createStart[1], createEnd[1]),
    ]);
    const viewportEnd = screenToLocal([
      Math.max(createStart[0], createEnd[0]),
      Math.max(createStart[1], createEnd[1]),
    ]);
    const transform = transformFromPoints(viewportStart, viewportEnd, 0);

    oncreate?.({
      id: sourceId(),
      tag: tag ?? filteredSourceTypes[0].tag,
      transform,
      props: {},
      style: {},
      children: [],
    });
    showCreateMenu = false;
  };

  const focus = (el: HTMLElement) => {
    setTimeout(() => {
      el.focus();
    }, 100);
  };
</script>

<svelte:window
  on:pointerdown={onpointerdown}
  on:pointermove={onpointermove}
  on:pointerup={onpointerup}
/>

{#if isCreating || showCreateMenu}
  <div
    class="absolute bg-green-700/25"
    style:left="{Math.min(createStart[0], createEnd[0])}px"
    style:top="{Math.min(createStart[1], createEnd[1])}px"
    style:width="{Math.max(createStart[0], createEnd[0]) -
      Math.min(createStart[0], createEnd[0])}px"
    style:height="{Math.max(createStart[1], createEnd[1]) -
      Math.min(createStart[1], createEnd[1])}px"
  />
{/if}

{#if showCreateMenu}
  <div
    class="fixed inset-0"
    on:pointerdown={() => {
      showCreateMenu = false;
    }}
  />

  {@const center = avgPoints(createStart, createEnd)}
  <div
    class="absolute z-10 flex w-full max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col rounded bg-white shadow"
    style:left="{center[0]}px"
    style:top="{center[1]}px"
    on:pointerdown={(ev) => {
      ev.stopPropagation();
    }}
    transition:scale={{ start: 0.9, duration: 100 }}
  >
    <input
      class="p-2"
      type="text"
      placeholder="Search for source"
      bind:value={search}
      on:keydown={({ key }) => {
        if (key === "Escape") {
          showCreateMenu = false;
          return;
        }
        if (key !== "Enter") return;
        if (filteredSourceTypes.length === 0) return;

        create();
      }}
      use:focus
    />
    <div class="border-b border-slate-200" />
    <ul class="flex max-h-32 flex-col overflow-y-auto">
      {#each filteredSourceTypes as st}
        <li>
          <button
            class="w-full px-2 py-1 text-left leading-none"
            on:click={() => {
              create(st.tag);
            }}
          >
            <p class="truncate">{st.label}</p>
            <p class="truncate text-sm text-slate-500">{st.label}</p>
          </button>
        </li>
      {/each}
    </ul>
  </div>
{/if}
