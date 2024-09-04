<script lang="ts">
  import EventFeed from "$lib/components/events/EventFeed.svelte";
  import { Select } from "bits-ui";
  import { RotateCw } from "lucide-svelte";

  import type { PageData } from "./$types";
  export let data: PageData;

  let selectedOverlay = "";

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
    {#await data.suspense.overlays}
      <div class="h-8 animate-pulse bg-slate-700" />
    {:then overlays}
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
    {/await}
    <div class="relative h-full w-full rounded-sm bg-black/25">
      <iframe
        class="pointer-events-none absolute left-0 top-0 h-[1080px] w-[1920px] origin-top-left"
        title="overlay"
        src={selectedOverlay ? `/overlays/render/${selectedOverlay}` : "about:blank"}
        use:fitFrame
      ></iframe>
      <div class="absolute inset-0 opacity-20 transition-opacity hover:opacity-100">
        <button class="absolute bottom-2 right-2 rounded bg-slate-700 px-2 py-1 text-white shadow"
          >Actions</button
        >
      </div>
    </div>
  </div>
  <div class="h-[32rem]">
    <EventFeed />
  </div>
</div>
