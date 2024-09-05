<script lang="ts">
  import clsx from "clsx";
  import toast from "svelte-french-toast";
  import { fly } from "svelte/transition";
  import { goto } from "$app/navigation";
  import { useEditor } from "$lib/overlay/contexts";
  import { DEFAULT_SCRIPTS } from "$lib/overlay/scripts";
  import EventFeed from "$lib/components/events/EventFeed.svelte";
  import Sync from "./Sync.svelte";
  import type { ActionDefinition } from "@sparklapse/breakfast/scripts";

  export let save: () => Promise<void>;
  export let abortAS: (() => void) | undefined;

  const {
    label,
    reloadFrame,
    scripts: { scripts, definitions, addScript, removeScript },
  } = useEditor();

  $: actions = $scripts
    .map((s) => s.actions ?? [])
    .reduce((acc, cur) => [...acc, ...cur], [] as ActionDefinition[]);

  let holdMenu = false;
  let showMenu = false;

  $: if (!holdMenu && !showMenu) {
  }
</script>

<div
  class={clsx([
    "fixed inset-y-4 left-4 w-full max-w-md overflow-y-auto rounded border border-slate-200 bg-white p-4 shadow transition-transform",
    !showMenu && !holdMenu && "-translate-x-[90%]",
  ])}
  on:pointerenter={() => {
    showMenu = true;
  }}
  on:pointerleave={() => {
    showMenu = false;
  }}
  on:pointerdown={(ev) => {
    ev.stopPropagation();
  }}
  on:pointerup={(ev) => {
    ev.stopPropagation();
  }}
  transition:fly|global={{ x: -50, duration: 250 }}
>
  <div class="mb-2 flex items-center justify-between">
    <h2 class="text-lg font-semibold">{$label}</h2>
    <button
      class="rounded-sm bg-slate-700 px-2 py-1 text-white shadow"
      on:click={async () => {
        abortAS?.();
        await toast.promise(save(), {
          loading: "Saving...",
          success: "Overlay saved!",
          error: (err) => `Failed to save overlay: ${err.message}`,
        });
        goto("/breakfast/overlays");
      }}
    >
      Save & Close
    </button>
  </div>
  <hr class="my-2" />

  <!-- OBS Sync -->
  <h3 class="font-semibold">OBS Sync</h3>
  <Sync {abortAS} {save} />

  <!-- Scripts Management -->
  <div class="mt-6 flex items-center gap-2">
    <h3 class="font-semibold">Scripts</h3>
    <p class="text-sm text-slate-400">(Components {$definitions.length})</p>
  </div>
  <button
    class="w-full rounded border border-slate-700 text-sm text-slate-700"
    on:click={() => {
      for (const s of DEFAULT_SCRIPTS) {
        removeScript(s.id);
        addScript(s);
      }
      reloadFrame();
    }}
  >
    Reinstall Basics
  </button>
  <ul>
    {#each $scripts as script}
      <li title={script.id}>{script.label}</li>
    {/each}
  </ul>

  <!-- Event feed -->
  <h3 class="mt-6 font-semibold">Actions</h3>
  <div class="h-[24rem]">
    <EventFeed
      {actions}
      onPauseChange={(paused) => {
        holdMenu = paused;
      }}
      hideSettings
    />
  </div>
</div>
