<script lang="ts">
  import { ArrowUp, UsersRound } from "lucide-svelte";
  import { onMount } from "svelte";

  import type { PageData } from "./$types";
  export let data: PageData;

  let viewerStats = data.suspense.viewerStats;

  onMount(() => {
    const unlisten = data.pb.collection("viewers").subscribe("*", (data) => {
      if (data.action == "create") {
        viewerStats = viewerStats.then(({ total, new30 }) => ({
          total: total + 1,
          new30: new30 + 1,
        }));
      }
    });

    return () => {
      unlisten.then((u) => u());
    };
  });
</script>

<dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
  <div class="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6">
    <dt>
      <div class="absolute rounded-md bg-slate-500 p-3">
        <UsersRound class="size-6 text-white" />
      </div>
      <p class="ml-16 truncate text-sm font-medium text-gray-500">Total Viewers</p>
    </dt>
    <dd class="ml-16 flex items-baseline pb-6 sm:pb-7">
      <p class="text-2xl font-semibold text-gray-900">
        {#await viewerStats}
          ...
        {:then stats}
          {stats.total}
        {/await}
      </p>
      <p class="ml-2 flex items-baseline text-sm font-semibold text-green-600">
        <ArrowUp class="size-5 flex-shrink-0 self-center text-green-500" />
        <span class="sr-only"> Increased by </span>
        {#await viewerStats}
          ...
        {:then stats}
          {stats.new30}
        {/await}
      </p>
      <div class="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
        <div class="text-sm">
          <a
            href="/breakfast/community/viewers"
            class="font-medium text-slate-600 hover:text-slate-500"
            >View all<span class="sr-only"> Total Subscribers stats</span></a
          >
        </div>
      </div>
    </dd>
  </div>
</dl>
