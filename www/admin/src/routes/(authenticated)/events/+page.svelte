<script lang="ts">
  import EventFeed from "$lib/components/events/EventFeed.svelte";
  import CalendarCheck2 from "lucide-svelte/icons/calendar-check-2";

  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<div class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
  <div
    class="relative h-fit overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
  >
    <dt>
      <div class="absolute rounded-md bg-slate-500 p-3">
        <CalendarCheck2 class="size-6 text-white" />
      </div>
      <p class="ml-16 truncate text-sm font-medium text-gray-500">Saved Events</p>
    </dt>
    <dd class="ml-16 flex items-baseline pb-6 sm:pb-7">
      <p class="text-2xl font-semibold text-gray-900">
        {#await data.suspense.totalSavedEvents}
          ...
        {:then count}
          {count}
        {/await}
      </p>
      <div class="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
        <div class="flex justify-between text-sm">
          <!-- Left hand link will be view all to see saved events -->
          <div />
          <a
            href="/breakfast/events/settings"
            class="font-medium text-slate-600 hover:text-slate-500">Settings</a
          >
        </div>
      </div>
    </dd>
  </div>
  <div class="col-span-2 h-[24rem]">
    <EventFeed />
  </div>
</div>
