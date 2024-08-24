<script lang="ts">
  import toast from "svelte-french-toast";
  import Stats from "$lib/components/obs/Stats.svelte";

  import type { PageData } from "./$types";
  export let data: PageData;
  const obsConnected = data.obs.connectedStore;

  const connectSubmit = (ev: SubmitEvent & { currentTarget: HTMLFormElement }) => {
    ev.preventDefault();
    const formData = new FormData(ev.currentTarget);
    const connectInfo = Object.fromEntries(formData.entries()) as {
      password: string;
      port: string;
      address: string;
    };

    toast.promise(
      data.obs
        .connect(connectInfo.password, parseInt(connectInfo.port), connectInfo.address)
        .then(() => {
          localStorage.setItem("obs.password", connectInfo.password);
          if (connectInfo.port !== "4455") localStorage.setItem("obs.port", connectInfo.port);
          if (connectInfo.address !== "ws://localhost")
            localStorage.setItem("obs.address", connectInfo.address);
        }),
      {
        loading: "Connecting to OBS...",
        success: "Connected!",
        error: (err) => `Failed to connect to OBS: ${err.message}`,
      },
    );
  };
</script>

<div class="flex flex-col gap-2 xl:grid xl:grid-cols-2">
  <div class="rounded-xl border border-gray-200 bg-white p-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Connection Config</h3>
      {#if !$obsConnected}
        <a href="/breakfast/obs/wizard" class="rounded bg-slate-700 px-2 text-white">
          Need help setting up?
        </a>
      {/if}
    </div>
    <hr class="mt-1" />
    <form class="contents text-sm" on:submit={connectSubmit}>
      <div class="flex justify-between gap-x-4 py-3">
        <dt class="text-gray-500">Status</dt>
        <dd class="text-gray-700">{$obsConnected ? "Connected" : "Not Connected"}</dd>
      </div>
      <div class="flex justify-between gap-x-4 py-3">
        <dt class="text-gray-500">Password</dt>
        <input
          class="h-6 rounded border border-slate-400 px-1"
          type="password"
          name="password"
          placeholder="Enter Password"
          required
          value={localStorage.getItem("obs.password") ?? data.obs.password}
        />
      </div>
      <div class="flex justify-between gap-x-4 py-3">
        <dt class="text-gray-500">Port</dt>
        <input
          class="h-6 rounded border border-slate-400 px-1"
          type="password"
          name="port"
          placeholder="Enter Port"
          required
          value={localStorage.getItem("obs.port") ?? data.obs.port}
        />
      </div>
      <div class="flex justify-between gap-x-4 py-3">
        <dt class="text-gray-500">Address</dt>
        <input
          class="h-6 rounded border border-slate-400 px-1"
          type="password"
          name="address"
          placeholder="Enter Address"
          required
          value={localStorage.getItem("obs.address") ?? data.obs.address}
        />
      </div>
      <div class="flex justify-between gap-x-4 py-3 text-base">
        <div role="separator" />
        {#if $obsConnected}
          <button
            on:click={() => {
              data.obs.disconnect();
            }}
            class="rounded bg-red-700 px-2 text-white"
          >
            Disconnect
          </button>
        {:else}
          <button type="submit" class="rounded bg-green-700 px-2 text-white">Connect</button>
        {/if}
      </div>
    </form>
  </div>
  <div class="rounded-xl border border-gray-200 bg-white p-4">
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
