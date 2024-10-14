<script lang="ts">
  import { fly } from "svelte/transition";
  import Cable from "lucide-svelte/icons/cable";
  import ScrollText from "lucide-svelte/icons/scroll-text";
  import CopyPlus from "lucide-svelte/icons/copy-plus";
  import { useEditor } from "$lib/logic/index.js";
  import InfoAccordion from "$lib/components/info-accordion/index.js";
  import Creator from "./Creator.svelte";

  export let onsaveandclose: (() => Promise<void> | void) | undefined = undefined;

  const { label, save } = useEditor();
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
      class="w-44 text-lg font-semibold"
      type="text"
      placeholder="Untitled Overlay"
      bind:value={$label}
      on:blur={() => {
        save();
      }}
      on:keydown={(ev) => {
        if (ev.key !== "Enter") return;
        ev.currentTarget.blur();
      }}
    />
    <button class="rounded-sm bg-slate-700 px-2 py-1 text-white shadow" on:click={onsaveandclose}>
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
      <slot name="sync" />
    </InfoAccordion.Item>

    <!-- Source creator -->
    <InfoAccordion.Item value="create-source">
      <h3 class="flex items-center gap-2" slot="header">
        <CopyPlus class="size-5" />Create Source
      </h3>
      <Creator />
    </InfoAccordion.Item>

    <!-- Actions -->
    <!-- <InfoAccordion.Item value="actions">
      <h3 class="flex items-center gap-2" slot="header">
        <Gavel class="size-4" />Actions
      </h3>
      <Action actions={actions.filter((a) => a.type !== "on-event")} />
    </InfoAccordion.Item> -->

    <!-- Chat Feed -->
    <!-- <InfoAccordion.Item value="chat">
      <h3 class="flex items-center gap-2" slot="header">
        <MessageSquareText class="size-5" />Chat
      </h3>
      <div class="h-[24rem]">
        <EventFeed {actions} />
      </div>
    </InfoAccordion.Item> -->

    <!-- Scripts -->
    <InfoAccordion.Item value="scripts">
      <h3 class="flex items-center gap-2" slot="header">
        <ScrollText class="size-4" />Scripts
      </h3>
      <slot name="scripts" />
    </InfoAccordion.Item>
  </InfoAccordion.Root>

  <slot />
</div>
