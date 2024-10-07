<script lang="ts">
  import toast from "svelte-french-toast";
  import { fly } from "svelte/transition";
  import { Select } from "bits-ui";
  import MessageSquareText from "lucide-svelte/icons/message-square-text";
  import Cable from "lucide-svelte/icons/cable";
  import Gavel from "lucide-svelte/icons/gavel";
  import ScrollText from "lucide-svelte/icons/scroll-text";
  import CopyPlus from "lucide-svelte/icons/copy-plus";
  import { useEditor } from "@sparklapse/breakfast/overlay";

  import EventFeed from "$lib/components/events/EventFeed.svelte";
  import Action from "$lib/components/events/Action.svelte";
  import InfoAccordion from "$lib/components/common/info-accordion";
  import Sync from "$lib/components/overlay/Sync.svelte";
  import { goto } from "$app/navigation";

  import Creator from "./Creator.svelte";
  import type { ActionDefinition } from "@sparklapse/breakfast/overlay";

  import type { PageData } from "./$types";
  import Scripts from "./Scripts.svelte";
  import { promise } from "zod";
  export let data: PageData;

  export let save: () => Promise<void>;
  export let abortAS: (() => void) | undefined;

  const visibilites: { label: string; value: string }[] = [
    { label: "Public", value: "PUBLIC" },
    { label: "Unlisted", value: "UNLISTED" },
    { label: "Private", value: "PRIVATE" },
  ];
  let visibility: string = data.overlay.visibility;

  const {
    label,
    reloadFrame,
    scripts: { scripts },
    sources: { sources },
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
      class="w-44 text-lg font-semibold"
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
    <div class="flex gap-2">
      <Select.Root
        items={visibilites}
        onSelectedChange={(selected) => {
          if (!selected) return;
          if (visibility === selected.value) return;
          visibility = selected.value;
          toast.promise(data.pb.collection("overlays").update(data.overlay.id, { visibility }), {
            loading: "Updating overlay visibility...",
            success: "Visibility changed!",
            error: (err) => `Failed to update visibility: ${err.message}`,
          });
        }}
      >
        <Select.Trigger class="w-24 text-right text-slate-400">
          {visibilites.find((v) => v.value === visibility)?.label ?? "Select a visibility"}
        </Select.Trigger>
        <Select.Content
          class="rounded bg-white py-2 text-right shadow-lg"
          align="end"
          transition={fly}
          transitionConfig={{ y: 10, duration: 100 }}
        >
          {#each visibilites as vis}
            <Select.Item class="cursor-pointer px-2 hover:bg-slate-50" value={vis.value}
              >{vis.label}</Select.Item
            >
          {/each}
        </Select.Content>
      </Select.Root>
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
  </div>

  <hr />

  <InfoAccordion.Root inititalOpened={["obs-sync", "create-source"]}>
    <!-- OBS Sync -->
    <InfoAccordion.Item value="obs-sync">
      <h3 class="flex items-center gap-2" slot="header">
        <Cable class="size-5" />OBS Sync
      </h3>
      <Sync
        beforesync={async () => {
          if ($sources.length === 0) {
            toast.error("Can't sync an empty scene");
            throw new Error("empty scene");
          }
          abortAS?.();
          await toast.promise(save(), {
            loading: "Saving overlay before sync...",
            success: "Overlay saved!",
            error: (err) => `Failed to save overlay: ${err.message}`,
          });
        }}
        aftersync={() => {
          toast.success("Synced to OBS!");
        }}
      />
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
      <Scripts {reloadFrame} {save} />
    </InfoAccordion.Item>
  </InfoAccordion.Root>
</div>
