<script lang="ts" context="module">
  export const utils: { save?: () => Promise<void> } = {
    save: undefined,
  };
</script>

<script lang="ts">
  import clsx from "clsx";
  import { Hand, Maximize, MousePointer2, PlusSquare } from "lucide-svelte";
  import { createViewport, createEditor } from "$lib/editor/contexts";
  import { page } from "$app/stores";
  import Viewport, { DEFAULT_GRID, DEFAULT_VIEW } from "./Viewport.svelte";
  import Menu from "./Menu.svelte";
  import Selector from "./Selector.svelte";
  import Transformer from "./Transformer.svelte";
  import Creator from "./Creator.svelte";
  import Inspector from "./Inspector.svelte";

  import type { PageData } from "./$types";
  import { onMount } from "svelte";
  export let data: PageData;

  const {
    stores: { disableMouseControls },
    utils: { screenToLocal, panTo },
  } = createViewport({ initialView: DEFAULT_VIEW });
  const {
    mount,
    scene,
    sources: { sources, addSource, removeSource },
    selection: { action, selectedIds, singleSelect, addSelect, selectAll, areaSelect, deselect },
  } = createEditor({
    label: data.scene.label,
    scripts: data.scene.scripts,
    scene: data.scene.sources,
  });

  utils.save = async () => {
    const clone = $scene.cloneNode(true);
    let sources: string;
    if (clone.nodeType === Node.ELEMENT_NODE) {
      sources = (clone as HTMLElement).innerHTML;
      (clone as HTMLElement).remove();
    } else {
      const tmp = document.createElement("div");
      tmp.append(clone);
      sources = tmp.innerHTML;
      tmp.remove();
    }

    localStorage.setItem(`autosave.${$page.params.id}.sources`, sources);
    await data.pb.collection("scenes").update($page.params.id, {
      sources,
    });
  };

  type Tools = "select" | "pan" | "create";
  let baseTool: Tools = "select";
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

  let saveTimeout: ReturnType<typeof setTimeout> | undefined;
  $: if ($sources) {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      if (!utils.save) return;
      utils
        .save()
        .catch(() => {
          // err
        })
        .finally(() => {
          saveTimeout = undefined;
        });
    }, 3000);
  }
  onMount(() => {
    const interval = setInterval(() => {
      if (!utils.save) return;
      utils
        .save()
        .catch(() => {
          // err
        })
        .finally(() => {
          // We can safely cancel the shorter timer since PB will cancel this save if new changes come through
          saveTimeout = undefined;
        });
    }, 30_000);

    return () => {
      clearInterval(interval);
    };
  });
</script>

<svelte:window
  on:keydown={(ev) => {
    if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement) return;

    if (ev.key === "1") baseTool = "select";
    if (ev.key === "2") baseTool = "pan";
    if (ev.key === "3") baseTool = "create";
    if (ev.key === "a" && ev.ctrlKey) {
      ev.preventDefault();
      selectAll();
    }

    if (ev.key === "Backspace" || ev.key === "Delete") {
      if ($selectedIds.length === 0) return;

      for (const id of $selectedIds) {
        removeSource(id);
      }
    }

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
      use:mount
    ></iframe>
    {#each $sources as source}
      <div
        class={clsx([
          "absolute grid place-content-center rounded-[1px] outline-none transition-colors",
          tool === "select" &&
            !$selectedIds.includes(source.id) && [
              isShifting && "bg-black/10",
              $action === "selecting" &&
                "cursor-pointer border-slate-900/10 hover:border hover:bg-black/10",
            ],
          $selectedIds.includes(source.id) && [
            "border",
            $action === "selecting" && "border-blue-600",
            $action === "translating" && "border-green-600",
            $action === "rotating" && "border-pink-400",
            $action === "resizing" && "border-yellow-600",
          ],
        ])}
        style:left="{source.transform.x}px"
        style:top="{source.transform.y}px"
        style:width="{source.transform.width}px"
        style:height="{source.transform.height}px"
        style:transform="rotate({source.transform.rotation}deg)"
        on:pointerdown={(ev) => {
          if (tool !== "select") return;
          ev.stopPropagation();
          if (ev.shiftKey) addSelect(source.id);
          else singleSelect(source.id);
        }}
      />
    {/each}
  </Viewport>
  <div class={clsx(["contents", tool !== "select" && "pointer-events-none"])}>
    <Transformer />
  </div>
  <Selector
    canSelect={tool === "select"}
    onselect={([start, end]) => {
      areaSelect([screenToLocal(start), screenToLocal(end)]);
    }}
    ondeselect={() => deselect()}
  />
  <Creator
    canCreate={tool === "create"}
    oncreate={(source) => {
      addSource(source);
      singleSelect(source.id);
      baseTool = "select";
    }}
  />
  <!-- Menu -->
  <Menu />
  <!-- Inspector -->
  <Inspector />
  <!-- Controls -->
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
