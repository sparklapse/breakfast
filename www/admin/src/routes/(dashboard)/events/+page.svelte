<script lang="ts">
  import { Settings } from "lucide-svelte";

  import type { PageData } from "./$types";
  import EventFeed from "$lib/components/events/EventFeed.svelte";
  export let data: PageData;
  const { user } = data;
</script>

<div class="mb-4 flex items-center justify-between">
  <div class="flex gap-2">
    <!-- <button class="rounded bg-red-700 px-2 text-white">Purge Old Events</button>
    <button class="rounded bg-red-700 px-2 text-white">Purge All Events</button> -->
  </div>
  <div class="flex items-center">
    <a href="/breakfast/events/settings" class="aspect-square">
      <Settings />
    </a>
  </div>
</div>

<div class="grid lg:grid-cols-2 2xl:grid-cols-3">
  <div class="h-[32rem]">
    <EventFeed />
  </div>
</div>
