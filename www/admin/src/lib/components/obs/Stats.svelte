<script lang="ts">
  import { page } from "$app/stores";
  import type { OBSWebSocket, RequestTypeResponses } from "$lib/connections/obs";
  import { onMount } from "svelte";
  $: obs = $page.data.obs as OBSWebSocket;

  export let shownStats: (keyof RequestTypeResponses<"GetStats"> | "show-more")[] = [
    "activeFps",
    "availableDiskSpace",
    "averageFrameRenderTime",
    "cpuUsage",
    "memoryUsage",
    "outputSkippedFrames",
    "outputTotalFrames",
    "renderSkippedFrames",
    "renderTotalFrames",
    "webSocketSessionIncomingMessages",
    "webSocketSessionOutgoingMessages",
    "show-more",
  ];

  let stats: Awaited<ReturnType<typeof obs.request<"GetStats">>> | undefined = undefined;

  onMount(() => {
    let done = false;
    let timeout: ReturnType<typeof setTimeout>;
    const refresh = async () => {
      if (done) return;
      if (!obs.connected) return;

      stats = await obs.request({ type: "GetStats", options: undefined });
      timeout = setTimeout(refresh, 3000);
    };
    refresh();

    return () => {
      done = true;
      clearTimeout(timeout);
    };
  });
</script>

{#if stats?.status === "success"}
  {#if shownStats.includes("activeFps")}
    <div class="flex justify-between gap-x-4 py-3">
      <dt class="text-gray-500">Active FPS</dt>
      <dd class="text-gray-700">
        {stats.data.activeFps.toFixed(0)} FPS
      </dd>
    </div>
  {/if}
  {#if shownStats.includes("availableDiskSpace")}
    <div class="flex justify-between gap-x-4 py-3">
      <dt class="text-gray-500">Available Disk Space</dt>
      <dd class="text-gray-700">
        {(stats.data.availableDiskSpace / 1000).toFixed(2)} GB
      </dd>
    </div>
  {/if}
  {#if shownStats.includes("averageFrameRenderTime")}
    <div class="flex justify-between gap-x-4 py-3">
      <dt class="text-gray-500">Average Frame Render Time</dt>
      <dd class="text-gray-700">
        {stats.data.averageFrameRenderTime.toFixed(2)} ms
      </dd>
    </div>
  {/if}
  {#if shownStats.includes("cpuUsage")}
    <div class="flex justify-between gap-x-4 py-3">
      <dt class="text-gray-500">CPU Usage</dt>
      <dd class="text-gray-700">
        {stats.data.cpuUsage.toFixed(2)} %
      </dd>
    </div>
  {/if}
  {#if shownStats.includes("memoryUsage")}
    <div class="flex justify-between gap-x-4 py-3">
      <dt class="text-gray-500">Memory Usage</dt>
      <dd class="text-gray-700">
        {stats.data.memoryUsage.toFixed(2)} MB
      </dd>
    </div>
  {/if}
  {#if shownStats.includes("outputSkippedFrames") || shownStats.includes("outputTotalFrames")}
    <div class="flex justify-between gap-x-4 py-3">
      <dt class="text-gray-500">Output Frames (Skipped/Total)</dt>
      <dd class="text-gray-700">
        {stats.data.outputSkippedFrames}/{stats.data.outputTotalFrames}
      </dd>
    </div>
  {/if}
  {#if shownStats.includes("renderSkippedFrames") || shownStats.includes("renderTotalFrames")}
    <div class="flex justify-between gap-x-4 py-3">
      <dt class="text-gray-500">Render Frames (Skipped/Total)</dt>
      <dd class="text-gray-700">
        {stats.data.renderSkippedFrames}/{stats.data.renderTotalFrames}
      </dd>
    </div>
  {/if}
  {#if shownStats.includes("webSocketSessionIncomingMessages") || shownStats.includes("webSocketSessionOutgoingMessages")}
    <div class="flex justify-between gap-x-4 py-3">
      <dt class="text-gray-500">Messages (In/Out)</dt>
      <dd class="text-gray-700">
        {stats.data.webSocketSessionIncomingMessages}/{stats.data.webSocketSessionOutgoingMessages}
      </dd>
    </div>
  {/if}
  {#if shownStats.includes("show-more") && $page.route.id !== "/(dashboard)/obs"}
    <div class="flex justify-between gap-x-4 py-3">
      <p class="text-gray-500">Show all stats</p>
      <a href="/breakfast/obs" class="rounded bg-slate-700 px-2 text-white"> See all Stats </a>
    </div>
  {/if}
{/if}
