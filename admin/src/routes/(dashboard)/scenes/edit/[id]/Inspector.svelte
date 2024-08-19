<script lang="ts">
  import clsx from "clsx";
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import { Pin, PinOff } from "lucide-svelte";
  import { useEditor } from "$lib/hooks/editor";

  const {
    sources: { sources },
    selection: { selectedIds, selectedSources, singleSelect, addSelect, deselect },
  } = useEditor();

  let showInspector = false;
  let pinOpen = true;
  let tab: "source" | "scene" = "scene";

  $: localStorage.setItem("editor.inspector.pinOpen", JSON.stringify(pinOpen));

  onMount(() => {
    const saved = localStorage.getItem("editor.inspector.pinOpen");
    if (saved) {
      try {
        const restore = JSON.parse(saved);
        pinOpen = !!restore;
      } catch {
        localStorage.removeItem("editor.inspector.pinOpen");
      }
    }
  });
</script>

<div
  class={clsx([
    "fixed right-4 top-4 h-full max-h-72 w-full max-w-md overflow-y-auto rounded border border-slate-200 bg-white p-4 shadow transition-transform",
    !(showInspector || pinOpen) && "translate-x-[90%]",
  ])}
  on:pointerenter={() => {
    showInspector = true;
  }}
  on:pointerleave={() => {
    showInspector = false;
  }}
  on:pointerdown={(ev) => {
    ev.stopPropagation();
  }}
  on:pointerup={(ev) => {
    ev.stopPropagation();
  }}
  transition:fly|global={{ x: 50, duration: 250 }}
>
  <button
    class={clsx([
      "absolute left-2 top-2 transition-opacity",
      !(showInspector || pinOpen) && "opacity-25",
    ])}
    on:click={() => {
      pinOpen = !pinOpen;
    }}
  >
    {#if pinOpen}
      <PinOff size="1rem" />
    {:else}
      <Pin size="1rem" />
    {/if}
  </button>
  <div class="relative mb-2 flex items-center justify-between gap-1">
    <button
      class="w-full"
      on:click={() => {
        tab = "scene";
      }}
    >
      Scene
    </button>
    <button
      class="w-full"
      on:click={() => {
        tab = "source";
      }}
    >
      Source
    </button>
    <div
      class={clsx([
        "absolute bottom-0 h-0.5 w-1/2 bg-slate-700 transition-[left]",
        tab === "scene" ? "left-0" : "left-1/2",
      ])}
    />
  </div>
  {#if tab === "scene"}
    <ul>
      {#each $sources as source}
        <li class={clsx([$selectedIds.includes(source.id) && "bg-blue-50"])}>
          <button
            class="w-full text-left"
            on:click={(ev) => {
              if (ev.shiftKey) {
                if ($selectedIds.length === 0) singleSelect(source.id);
                else {
                  const start = $sources.findIndex((s) => s.id === $selectedIds[0]);
                  const end = $sources.findIndex((s) => s.id === source.id);
                  const newSelection = $sources.slice(
                    Math.min(start, end),
                    Math.max(start, end) + 1,
                  );
                  deselect();
                  for (const s of newSelection) {
                    addSelect(s.id);
                  }
                }
              } else singleSelect(source.id);
            }}
          >
            {source.tag}
          </button>
        </li>
      {/each}
    </ul>
  {:else if tab === "source"}
    {#if $selectedIds.length !== 1}
      <p class="text-center text-sm text-slate-700">{$selectedIds.length} Sources selected</p>
    {/if}
  {/if}
</div>
