<script lang="ts">
  import { Select } from "bits-ui";
  import { RotateCw } from "lucide-svelte";
  import Action from "$lib/components/events/Action.svelte";
  import EventFeed from "$lib/components/events/EventFeed.svelte";

  import type { PageData } from "./$types";
  import type { ActionDefinition, OverlayScript } from "@sparklapse/breakfast/scripts";
  export let data: PageData;

  let overlays: Awaited<typeof data.suspense.overlays> | undefined = undefined;
  let selectedOverlay = "";

  $: data.suspense.overlays.then((o) => (overlays = o));
  $: actions = overlays
    ?.map(({ scripts }) => scripts)
    .reduce((acc, cur) => [...acc, ...cur], [] as OverlayScript[])
    .map((s) => s.actions ?? [])
    .reduce((acc, cur) => [...acc, ...cur], [] as ActionDefinition[]);

  const fitFrame = (el: HTMLIFrameElement) => {
    const parent = el.parentElement;
    if (!parent) return;

    const resize = () => {
      const { width, height } = parent.getBoundingClientRect();
      el.style.transform = `scale(${Math.min(width / 1920, height / 1080)})`;
    };
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(parent);

    return {
      destroy: () => {
        observer.disconnect();
      },
    };
  };
</script>

<div class="grid gap-2 lg:grid-cols-2 2xl:grid-cols-3">
  <div class="grid h-[32rem] grid-rows-[2rem,1fr] gap-2 overflow-hidden lg:col-span-2">
    {#if !overlays}
      <div class="h-8 animate-pulse bg-slate-700" />
    {:else}
      <div class="flex gap-2">
        <Select.Root
          items={overlays}
          onSelectedChange={(selected) => {
            if (!selected) return;
            selectedOverlay = selected.value;
          }}
        >
          <Select.Trigger
            class="flex h-8 w-full items-center rounded border border-slate-400 bg-white px-2 py-1 text-lg outline-none"
          >
            <Select.Value placeholder="Select an overlay" />
          </Select.Trigger>
          <Select.Content class="rounded bg-white py-2 shadow-lg">
            {#each overlays as overlay}
              <Select.Item class="px-2 hover:bg-slate-50" value={overlay.value}
                >{overlay.label}</Select.Item
              >
            {:else}
              <p class="text-sm text-slate-400 px-2">
                No overlays! Go make one then come back here...
              </p>
            {/each}
          </Select.Content>
        </Select.Root>
        <button
          class="grid aspect-square flex-shrink-0 place-content-center rounded border border-slate-400 bg-white text-slate-700"
          on:click={() => {
            document.querySelector("iframe")?.contentWindow?.location.reload();
          }}><RotateCw /></button
        >
      </div>
    {/if}
    <div class="relative h-full w-full rounded-sm bg-black/25">
      <iframe
        class="pointer-events-none absolute left-0 top-0 h-[1080px] w-[1920px] origin-top-left"
        title="overlay"
        src={selectedOverlay ? `/overlays/render/${selectedOverlay}` : "about:blank"}
        use:fitFrame
      ></iframe>
      <div class="absolute inset-0 opacity-20 transition-opacity hover:opacity-95">
        <div class="absolute bottom-2 right-2 w-full max-w-md">
          <Action {actions} />
        </div>
      </div>
    </div>
  </div>
  <div class="h-[32rem]">
    <EventFeed {actions} />
  </div>
</div>
