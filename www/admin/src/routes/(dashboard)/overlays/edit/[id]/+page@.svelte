<script lang="ts">
  import clsx from "clsx";
  import toast from "svelte-french-toast";
  import Hand from "lucide-svelte/icons/hand";
  import Maximize from "lucide-svelte/icons/maximize";
  import MousePointer2 from "lucide-svelte/icons/mouse-pointer-2";
  import PlusSquare from "lucide-svelte/icons/square-plus";
  import {
    createViewport,
    createEditor,
    sourceType,
    sourceId,
  } from "@sparklapse/breakfast/overlay";
  import { page } from "$app/stores";
  import Viewport, { DEFAULT_GRID, DEFAULT_VIEW } from "./Viewport.svelte";
  import Menu from "./Menu.svelte";
  import Selector from "./Selector.svelte";
  import Transformer from "./Transformer.svelte";
  import Creator from "./Creator.svelte";
  import Inspector from "./Inspector.svelte";

  import type { PageData } from "./$types";
  export let data: PageData;
  const { user } = data;

  const {
    stores: { disableMouseControls },
    utils: { screenToLocal, panTo },
  } = createViewport({ initialView: DEFAULT_VIEW });
  const {
    mount,
    overlay,
    scripts: { scripts },
    sources: { sources, addSource, removeSource, moveSourceUp, moveSourceDown },
    selection: {
      action,
      selectedIds,
      selectedSources,
      singleSelect,
      addSelect,
      selectAll,
      areaSelect,
      deselect,
    },
  } = createEditor({
    label: data.overlay.label,
    scripts: data.overlay.scripts,
    overlay: data.overlay.sources,
  });

  const save = async () => {
    const clone = $overlay.cloneNode(true);
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
    await data.pb.collection("overlays").update($page.params.id, {
      sources,
      scripts: $scripts,
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

  let abort: () => void | undefined;
  $: if ($sources) {
    abort?.();
    new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        resolve();
      }, 1000);

      abort = () => {
        clearTimeout(timeout);
        reject();
      };
    })
      .then(() => save())
      .catch(() => {
        // Cancelled
      });
  }
</script>

<!-- Keyboard shortcuts -->
<svelte:window
  on:keydown={(ev) => {
    if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement) return;

    switch (ev.key) {
      case "1":
        baseTool = "select";
        break;
      case "2":
        baseTool = "pan";
        break;
      case "3":
        baseTool = "create";
        break;
      case "a":
        if (ev.ctrlKey) {
          ev.preventDefault();
          selectAll();
        }
        break;
      case "c":
        if (ev.ctrlKey) {
          if ($selectedIds.length === 0) return;
          ev.preventDefault();
          const type = "text/plain";
          const blob = new Blob([JSON.stringify($selectedSources)], { type });

          toast.promise(navigator.clipboard.write([new ClipboardItem({ [type]: blob })]), {
            loading: "Copying to clipboard...",
            success: "Copied to clipboard!",
            error: (err) => `Failed to copy to clipboard: ${err.message}`,
          });
        }
        break;
      case "v":
        if (ev.ctrlKey) {
          ev.preventDefault();
          navigator.clipboard
            .readText()
            .then((t) => JSON.parse(t))
            .then((d) => {
              const parsed = sourceType.array().safeParse(d);
              if (parsed.success === true) return parsed.data;
              throw new Error("You aren't pasting sources we can process");
            })
            .then((sources) => {
              deselect();
              for (const source of sources) {
                source.id = sourceId();
                addSource(source);
                addSelect(source.id);
              }
              toast.success("Pasted sources!");
            })
            .catch((err) => {
              toast.error(`Failed to paste sources: ${err.message}`);
            });
        }
        break;
      case "[":
        if (ev.ctrlKey) {
          if ($selectedIds.length === 0) return;

          for (const source of $sources.filter((s) => $selectedIds.includes(s.id))) {
            moveSourceDown(source.id);
          }
        }
        break;
      case "]":
        if (ev.ctrlKey) {
          if ($selectedIds.length === 0) return;

          for (const source of $sources.filter((s) => $selectedIds.includes(s.id)).reverse()) {
            moveSourceUp(source.id);
          }
        }
        break;
      case "Backspace":
      case "Delete":
        if ($selectedIds.length === 0) return;

        for (const id of $selectedIds) {
          removeSource(id);
        }
        break;
      case "Shift":
        isShifting = true;
        break;
      case " ":
        isSpacing = true;
        break;
    }
  }}
  on:keyup={(ev) => {
    switch (ev.key) {
      case "Shift":
        isShifting = false;
        break;
      case " ":
        isSpacing = false;
        break;
    }
  }}
/>

<div class="absolute inset-0 overflow-hidden">
  <Viewport
    class="relative size-full select-none overflow-hidden bg-zinc-100 text-zinc-300"
    grid={DEFAULT_GRID}
  >
    <iframe
      src="{window.location.origin}/overlays/template?sk={$user?.streamKey}"
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
  <!-- Inspector -->
  <Inspector />
  <!-- Menu -->
  <Menu {data} abortAS={abort} {save} />
</div>
