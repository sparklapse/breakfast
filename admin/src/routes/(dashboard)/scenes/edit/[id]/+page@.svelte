<script lang="ts">
  import clsx from "clsx";
  import toast from "svelte-french-toast";
  import { fly } from "svelte/transition";
  import { Hand, Maximize, MousePointer2, PlusSquare } from "lucide-svelte";
  import { createEditor } from "$lib/hooks/editor";
  import { createViewport } from "$lib/hooks/viewport";
  import { goto } from "$app/navigation";
  import Viewport, { DEFAULT_GRID, DEFAULT_VIEW } from "./Viewport.svelte";
  import Selector from "./Selector.svelte";
  import Transformer from "./Transformer.svelte";
  import Creator from "./Creator.svelte";

  import type { PageData } from "./$types";
  export let data: PageData;

  const {
    stores: { disableMouseControls },
    utils: { screenToLocal, panTo },
  } = createViewport({ initialView: DEFAULT_VIEW });
  const {
    sources,
    fragment,
    label,
    selection: { action, singleSelect, addSelect, areaSelect, deselect },
  } = createEditor({
    label: data.scene.label,
    sources: [
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
    ],
  });

  let frame: HTMLIFrameElement;
  $: if ($fragment && frame) {
    const frameWindow = frame.contentWindow;
    if (!frameWindow) break $;
    frameWindow.document.body.innerHTML = "";
    frameWindow.document.body.append($fragment);
  }

  type Tools = "select" | "pan" | "create";
  let baseTool: Tools = "pan";
  let isShifting = false;
  let isSpacing = false;
  $: tool =
    baseTool === "pan" && isShifting
      ? "select"
      : baseTool === "select" && isSpacing
        ? "pan"
        : baseTool;

  $: {
    if (tool === "pan") $disableMouseControls = false;
    else $disableMouseControls = true;
  }

  let showInspector = false;
</script>

<svelte:window
  on:keydown={(ev) => {
    if (ev.key === "Shift") isShifting = true;
    if (ev.key === " ") isSpacing = true;
  }}
  on:keyup={(ev) => {
    if (ev.key === "Shift") isShifting = false;
    if (ev.key === " ") isSpacing = false;
  }}
/>

<div class="absolute inset-0 overflow-hidden">
  <Viewport
    class="relative size-full select-none overflow-hidden bg-zinc-100 text-zinc-300"
    grid={DEFAULT_GRID}
  >
    <iframe
      title="overlay"
      class="pointer-events-none absolute left-0 top-0 h-[1080px] w-[1920px] select-none rounded-[1px] outline outline-zinc-700"
      frameborder="0"
      bind:this={frame}
    ></iframe>
    {#each $sources as source, idx}
      <div
        class={clsx([
          "absolute grid place-content-center rounded-[1px] outline-none transition-colors",
          $action === "selecting" && "border-slate-900/10 hover:border cursor-pointer",
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
  <Selector
    canSelect={tool === "select"}
    onselect={([start, end]) => {
      areaSelect([screenToLocal(start), screenToLocal(end)]);
    }}
    ondeselect={() => deselect()}
  />
  <Creator canCreate={tool === "create"} />
  <!-- Menu -->
  <div
    class={clsx([
      "fixed inset-y-4 left-4 w-full max-w-md rounded border border-slate-200 bg-white p-4 shadow transition-transform",
      !showInspector && "-translate-x-[90%]",
    ])}
    on:pointerenter={() => {
      showInspector = true;
    }}
    on:pointerleave={() => {
      showInspector = false;
    }}
    transition:fly|global={{ x: -50, duration: 250 }}
  >
    <div class="flex items-center justify-between">
      <h2
        class="font-semibold"
        contenteditable="plaintext-only"
        on:input={(ev) => {
          $label = ev.currentTarget.innerText;
          console.log("input");
        }}
        on:keydown={(ev) => {
          if (ev.key == "Enter") {
            ev.preventDefault();
            ev.currentTarget.blur();
          }
        }}
      >
        {$label}
      </h2>
      <button
        class="rounded-sm bg-slate-700 px-2 py-1 text-white shadow"
        on:click={() => {
          toast.promise(Promise.resolve("test"), {
            loading: "Saving...",
            success: () => {
              goto("/breakfast/scenes");
              return "Scene saved!";
            },
            error: (err) => `Failed to save scene: ${err.message}`,
          });
        }}
      >
        Save & Close
      </button>
    </div>
  </div>
  <!-- Camera controls -->
  <div
    class="fixed bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded border border-slate-200 bg-white p-2 text-slate-700 shadow"
  >
    <button
      class={clsx([
        "rounded-sm p-1",
        tool === "select" ? "bg-slate-700 text-white" : "hover:bg-slate-100",
      ])}
      on:click={() => {
        baseTool = "select";
      }}
    >
      <MousePointer2 />
    </button>
    <button
      class={clsx([
        "rounded-sm p-1",
        tool === "pan" ? "bg-slate-700 text-white" : "hover:bg-slate-100",
      ])}
      on:click={() => {
        baseTool = "pan";
      }}
    >
      <Hand />
    </button>
    <button
      class={clsx([
        "rounded-sm p-1",
        tool === "create" ? "bg-slate-700 text-white" : "hover:bg-slate-100",
      ])}
      on:click={() => {
        baseTool = "create";
      }}
    >
      <PlusSquare />
    </button>
    <div class="h-4 border-r border-slate-400" role="separator" />
    <button class="p-1 hover:bg-slate-100" on:click={() => panTo(DEFAULT_VIEW, 500)}>
      <Maximize />
    </button>
  </div>
</div>
