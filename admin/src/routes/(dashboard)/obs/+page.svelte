<script lang="ts">
  import Stats from "$lib/components/obs/Stats.svelte";
  import type { PageData } from "./$types";
  export let data: PageData;
  const obsConnected = data.obs.connectedStore;
</script>

<div class="flex flex-col gap-2 overflow-hidden xl:grid xl:grid-cols-2">
  <div class="rounded-xl border border-gray-200 bg-white p-4 shadow">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Connection Config</h3>
      {#if !$obsConnected}
        <button class="rounded bg-slate-700 px-2 text-white">Need help setting up?</button>
      {/if}
    </div>
    <hr class="mt-1" />
    <form class="contents text-sm">
      <div class="flex justify-between gap-x-4 py-3">
        <dt class="text-gray-500">Status</dt>
        <dd class="text-gray-700">{$obsConnected ? "Connected" : "Not Connected"}</dd>
      </div>
      <div class="flex justify-between gap-x-4 py-3">
        <dt class="text-gray-500">Password</dt>
        <input
          class="h-6 rounded border border-slate-400 px-1"
          type="password"
          placeholder="Enter Password"
          required
          value={data.obs.password}
        />
      </div>
      <div class="flex justify-between gap-x-4 py-3">
        <dt class="text-gray-500">Port</dt>
        <input
          class="h-6 rounded border border-slate-400 px-1"
          type="password"
          placeholder="Enter Port"
          required
          value={data.obs.port}
        />
      </div>
      <div class="flex justify-between gap-x-4 py-3">
        <dt class="text-gray-500">Address</dt>
        <input
          class="h-6 rounded border border-slate-400 px-1"
          type="password"
          placeholder="Enter Address"
          required
          value={data.obs.address}
        />
      </div>
      <div class="flex justify-between gap-x-4 py-3 text-base">
        <div role="separator" />
        <button class="rounded bg-green-700 text-white px-2">Connect</button>
      </div>
    </form>
  </div>
  <div class="rounded-xl border border-gray-200 bg-white p-4 shadow">
    <h3 class="text-lg font-semibold">Stats</h3>
    <hr class="mt-1" />
    {#if $obsConnected}
      <div class="contents text-sm">
        <Stats />
      </div>
    {:else}
      <p class="mt-2 text-center text-sm text-slate-400">Connect to OBS First</p>
    {/if}
  </div>
</div>
