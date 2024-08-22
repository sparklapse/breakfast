<script lang="ts">
  import clsx from "clsx";
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import { DropdownMenu } from "bits-ui";
  import { EllipsisVertical, Settings } from "lucide-svelte";
  import { navigating } from "$app/stores";

  import type { PageData } from "./$types";
  export let data: PageData;
  const { user } = data;

  let localEvents = data.suspense.initial.then((i) => i.events);

  onMount(() => {
    const unsubscribe = data.pb.realtime.subscribe("@breakfast/events", (event) => {
      localEvents = localEvents.then((e) => [event, ...e]);
    });

    return () => {
      unsubscribe.then((u) => u());
    };
  });
</script>

<div class="mb-4 flex items-center justify-between">
  <div class="flex gap-2">
    <!-- <button class="rounded bg-red-700 px-2 text-white">Purge Old Events</button>
    <button class="rounded bg-red-700 px-2 text-white">Purge All Events</button> -->
  </div>
  <div class="flex items-center">
    <button class="aspect-square">
      <Settings />
    </button>
  </div>
</div>

<ul role="list" class="divide-y divide-gray-100">
  {#await localEvents}
    <p>Loading</p>
  {:then events}
    {#if events.length === 0}
      <p>No events yet!</p>
    {/if}
    {#each events as event}
      <li class="flex items-center justify-between gap-x-6 py-5 first:pt-0 last:pb-0">
        <div class="min-w-0">
          <div class="flex items-start gap-x-3">
            <p class="text-sm font-semibold leading-6 text-gray-900">{event.type}</p>
          </div>
          <div class="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
            {#if event.data?.platform}
              <p>{event.data.platform}</p>
            {/if}
            {#if event.data?.chatter?.displayName}
              <p>{event.data.chatter.displayName}</p>
            {/if}
          </div>
        </div>
        <div class="flex flex-none items-center gap-x-4">
          <div class="relative flex-none">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger class="-m-2.5 block p-2.5 text-gray-500 hover:text-gray-900">
                <span class="sr-only">Open options</span>
                <EllipsisVertical class="h-5 w-5" />
              </DropdownMenu.Trigger>
              <DropdownMenu.Content
                class="w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none"
                transition={fly}
                transitionConfig={{ y: -20, duration: 100 }}
              >
                <DropdownMenu.Item class="block px-3 py-1 text-sm leading-6 text-gray-900">
                  View Full Data
                </DropdownMenu.Item>
                <!-- <DropdownMenu.Item
                  class="block cursor-pointer px-3 py-1 text-sm leading-6 text-red-900"
                  on:click={async () => {
                    if (event.id)
                      await toast.promise(data.pb.collection("events").delete(event.id), {
                        loading: "Deleting event...",
                        success: "Event deleted!",
                        error: (err) => `Failed to delete event: ${err.message}`,
                      });
                    events.splice(idx, 1);
                    localEvents = Promise.resolve(events);
                  }}
                >
                  Delete
                </DropdownMenu.Item> -->
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </div>
      </li>
    {/each}
  {/await}
</ul>
