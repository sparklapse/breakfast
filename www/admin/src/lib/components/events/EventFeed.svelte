<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { EllipsisVertical } from "lucide-svelte";
  import { fly } from "svelte/transition";
  import { DropdownMenu } from "bits-ui";
  import type { BreakfastEvent } from "@sparklapse/breakfast/overlay";

  let options = {
    pauseOnEnter: true,
  };
  let enterPause = false;
  let interactionPause = false;
  $: pause = (options.pauseOnEnter && enterPause) || interactionPause;

  let events: { e: BreakfastEvent[] } = { e: [] };
  onMount(() => {
    const unlisten = $page.data.pb.realtime.subscribe(
      "@breakfast/events",
      (event: BreakfastEvent) => {
        if (pause) return;

        const { e } = events;
        e.push(event);
        while (e.length > 50) e.shift();
        events = { e };
      },
    );

    return () => {
      unlisten.then((u) => u());
    };
  });
</script>

<div
  class="relative h-full overflow-hidden rounded border border-gray-200 bg-white"
  on:pointerenter={() => {
    enterPause = true;
  }}
  on:pointerleave={() => {
    enterPause = false;
  }}
>
  <ul class="absolute inset-x-0 bottom-2">
    {#each events.e as event}
      <li class="flex items-center justify-between px-2 py-1.5 hover:bg-slate-50">
        <div>
          <p class="text-xs leading-none text-slate-400">{event.data.channel.displayName}</p>
          {#if event.type === "chat-message"}
            <p class="leading-none">
              <span style:color={event.data.color}>{event.data.chatter.displayName}</span>: {event
                .data.text}
            </p>
          {:else}
            <span>{event.type}</span>
          {/if}
        </div>
        <DropdownMenu.Root
          onOpenChange={(open) => {
            interactionPause = open;
          }}
        >
          <DropdownMenu.Trigger class="aspect-square text-slate-400 hover:text-slate-700"
            ><EllipsisVertical /></DropdownMenu.Trigger
          >
          <DropdownMenu.Content class="flex flex-col rounded bg-white py-2 shadow" side="left">
            {#if event.initiator}
              <DropdownMenu.Item
                href="/breakfast/community/viewer/{event.initiator}"
                class="px-2 hover:bg-slate-50">View Viewer</DropdownMenu.Item
              >
            {/if}
            <DropdownMenu.Item class="px-2 hover:bg-slate-50">Delete</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </li>
    {/each}
  </ul>
  <div
    class="absolute inset-x-0 top-0 flex h-6 items-center justify-between bg-slate-700 px-2 text-sm text-white"
  >
    <p>Event Feed</p>
  </div>
  {#if pause}
    <div
      class="absolute left-1/2 top-8 -translate-x-1/2 rounded bg-slate-700 p-2 text-white shadow"
      transition:fly={{ y: -10, duration: 100 }}
    >
      <p class="text-center">Feed is paused during interaction</p>
    </div>
  {/if}
</div>
