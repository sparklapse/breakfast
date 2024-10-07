<script lang="ts">
  import toast from "svelte-french-toast";
  import Fuse from "fuse.js";
  import { page } from "$app/stores";
  import type { ActionDefinition } from "@sparklapse/breakfast/overlay";

  export let actions: ActionDefinition[] = [];

  let search = "";

  $: fuse = new Fuse(
    actions.filter((a) => a.type !== "on-event"),
    { keys: ["label", "subLabel", "emit"] },
  );

  $: filtered = search
    ? fuse.search(search).map((i) => i.item)
    : actions.filter((a) => a.type !== "on-event");
</script>

<div class="relative overflow-hidden rounded border border-gray-200 bg-white">
  <input
    class="h-8 w-full border-b border-gray-200 px-2 outline-none"
    type="text"
    placeholder="Search for an action"
    bind:value={search}
  />
  <div class="grid grid-rows-[repeat(4,3rem)] divide-y divide-slate-400">
    {#each filtered.slice(0, 4) as action}
      <button
        class="w-full px-2 text-left hover:bg-slate-50"
        on:click={() => {
          toast.promise(
            $page.data.pb.breakfast.overlays.action({
              type: action.type,
              emit: action.emit,
              inputs: {},
              event: null,
            }),
            {
              loading: "Performing action...",
              success: "Action success!",
              error: (err) => `Failed to perform action: ${err.message}`,
            },
          );
        }}
      >
        <p>{action.label}</p>
        <p class="text-xs text-slate-400">{action.subLabel}</p>
      </button>
    {/each}
  </div>
  <p class="px-2 text-center text-sm text-slate-400">
    {actions.length} Total Action{actions.length === 1 ? "" : "s"}
  </p>
</div>
