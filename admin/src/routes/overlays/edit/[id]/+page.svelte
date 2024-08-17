<script lang="ts">
  import { Maximize } from "lucide-svelte";
  import { createEditor } from "$lib/hooks/editor";
  import { createViewport } from "$lib/hooks/viewport";
  import Viewport, { DEFAULT_GRID, DEFAULT_VIEW } from "./Viewport.svelte";
  import Selector from "./Selector.svelte";
  import Transformer from "./Transformer.svelte";
  import clsx from "clsx";

  const {
    utils: { screenToLocal, panTo },
  } = createViewport({ initialView: DEFAULT_VIEW });
  const {
    sources,
    fragment,
    selection: { action, selectedSources, singleSelect, addSelect, areaSelect, deselect },
  } = createEditor([
    {
      id: "a",
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
      id: "b",
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
    {
      id: "c",
      tag: "some-html",
      transform: {
        x: 200,
        y: 0,
        width: 100,
        height: 100,
        rotation: 90,
      },
      props: {},
      children: [],
    },
  ]);

  let frame: HTMLIFrameElement;
  $: if (frame && $sources && fragment) {
    const frameWindow = frame.contentWindow;
    if (!frameWindow) break $;
    frameWindow.document.body.innerHTML = "";
    frameWindow.document.body.append(fragment);
  }

  let isShifting = false;
</script>

<svelte:window
  on:keydown={(ev) => {
    if (ev.key === "Shift") isShifting = true;
  }}
  on:keyup={(ev) => {
    if (ev.key === "Shift") isShifting = false;
  }}
/>

<div class="absolute inset-0 overflow-hidden">
  <Viewport
    class="relative size-full select-none overflow-hidden text-slate-300"
    grid={DEFAULT_GRID}
  >
    <iframe
      title="overlay"
      class="pointer-events-none absolute left-0 top-0 h-[1080px] w-[1920px] select-none"
      frameborder="0"
      bind:this={frame}
    ></iframe>
    <div
      class="pointer-events-none absolute left-0 top-0 h-[1080px] w-[1920px] rounded-[1px] outline outline-slate-700"
    />
    <!-- Debug source transforms -->
    {#each $sources as source, idx}
      <div
        class={clsx([
          "absolute grid cursor-pointer place-content-center rounded-[1px] outline-none transition-colors",
          $action === "selecting" && "border-slate-900/10 hover:border",
          isShifting && "bg-slate-900/10",
        ])}
        style:left="{source.transform.x}px"
        style:top="{source.transform.y}px"
        style:width="{source.transform.width}px"
        style:height="{source.transform.height}px"
        style:transform="rotate({source.transform.rotation}deg)"
        style:transition-delay="{idx * 50}ms"
        on:pointerdown={(ev) => {
          ev.stopPropagation();
          if (ev.shiftKey) addSelect(idx);
          else singleSelect(idx);
        }}
      />
    {/each}
  </Viewport>
  <Transformer />
  <div class="absolute bottom-4 right-4">
    <button
      class="rounded border border-slate-200 bg-white p-2 shadow"
      on:click={() => panTo(DEFAULT_VIEW, 500)}
    >
      <Maximize />
    </button>
  </div>
  <Selector
    onselect={([start, end]) => {
      areaSelect([screenToLocal(start), screenToLocal(end)]);
    }}
    ondeselect={() => deselect()}
  />
</div>
