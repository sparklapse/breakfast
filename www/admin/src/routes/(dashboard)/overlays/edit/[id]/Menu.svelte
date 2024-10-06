<script lang="ts">
  import toast from "svelte-french-toast";
  import { fly } from "svelte/transition";
  import MessageSquareText from "lucide-svelte/icons/message-square-text";
  import Cable from "lucide-svelte/icons/cable";
  import Gavel from "lucide-svelte/icons/gavel";
  import ScrollText from "lucide-svelte/icons/scroll-text";
  import CopyPlus from "lucide-svelte/icons/copy-plus";
  import { useEditor } from "@sparklapse/breakfast/overlay";
  import { DEFAULT_SCRIPTS } from "$lib/overlay/scripts";
  import EventFeed from "$lib/components/events/EventFeed.svelte";
  import Action from "$lib/components/events/Action.svelte";
  import InfoAccordion from "$lib/components/common/info-accordion";
  import { goto } from "$app/navigation";
  import Sync from "./Sync.svelte";
  import Creator from "./Creator.svelte";
  import type { ActionDefinition } from "@sparklapse/breakfast/overlay";

  import type { PageData } from "./$types";
  export let data: PageData;

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
</script>

<div
  class="fixed inset-y-4 left-4 isolate w-full max-w-md overflow-y-auto rounded border border-slate-200 bg-white p-4 shadow"
  on:pointerdown={(ev) => {
    ev.stopPropagation();
  }}
  on:pointerup={(ev) => {
    ev.stopPropagation();
  }}
  transition:fly|global={{ x: -50, duration: 250 }}
>
  <div class="mb-2 flex items-center justify-between">
    <input
      class="text-lg font-semibold"
      type="text"
      bind:value={$label}
      on:blur={() => {
        save();
      }}
      on:keydown={(ev) => {
        if (ev.key !== "Enter") return;
        ev.currentTarget.blur();
      }}
    />
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

  <hr />

  <InfoAccordion.Root inititalOpened={["obs-sync", "create-source"]}>
    <!-- OBS Sync -->
    <InfoAccordion.Item value="obs-sync">
      <h3 class="flex items-center gap-2" slot="header">
        <Cable class="size-5" />OBS Sync
      </h3>
      <Sync {data} {abortAS} {save} />
    </InfoAccordion.Item>

    <!-- Source creator -->
    <InfoAccordion.Item value="create-source">
      <h3 class="flex items-center gap-2" slot="header">
        <CopyPlus class="size-5" />Create Source
      </h3>
      <Creator />
    </InfoAccordion.Item>

    <!-- Actions -->
    <InfoAccordion.Item value="actions">
      <h3 class="flex items-center gap-2" slot="header">
        <Gavel class="size-4" />Actions
      </h3>
      <Action actions={actions.filter((a) => a.type !== "on-event")} />
    </InfoAccordion.Item>

    <!-- Chat Feed -->
    <InfoAccordion.Item value="chat">
      <h3 class="flex items-center gap-2" slot="header">
        <MessageSquareText class="size-5" />Chat
      </h3>
      <div class="h-[24rem]">
        <EventFeed {actions} />
      </div>
    </InfoAccordion.Item>

    <!-- Scripts -->
    <InfoAccordion.Item value="scripts">
      <h3 class="flex items-center gap-2" slot="header">
        <ScrollText class="size-4" />Scripts
      </h3>
      <div class="flex items-center gap-2">
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
          <li title={script.id}>
            {script.label} <span class="text-sm text-slate-400">(v{script.version})</span>
          </li>
        {/each}
      </ul>
    </InfoAccordion.Item>
  </InfoAccordion.Root>
</div>
