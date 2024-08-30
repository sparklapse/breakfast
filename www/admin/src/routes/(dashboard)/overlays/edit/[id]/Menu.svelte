<script lang="ts">
  import clsx from "clsx";
  import toast from "svelte-french-toast";
  import { fly } from "svelte/transition";
  import { useEditor } from "$lib/overlay/contexts";
  import { goto } from "$app/navigation";
  import Sync from "./Sync.svelte";

  export let save: () => Promise<void>;
  export let abortAS: (() => void) | undefined;

  const { label } = useEditor();

  let showMenu = false;
</script>

<div
  class={clsx([
    "fixed inset-y-4 left-4 w-full max-w-md overflow-y-auto rounded border border-slate-200 bg-white p-4 shadow transition-transform",
    !showMenu && "-translate-x-[90%]",
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
  <h3 class="font-semibold">OBS Sync</h3>
  <Sync {abortAS} {save} />
</div>
