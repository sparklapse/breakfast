<script lang="ts">
  import toast from "svelte-french-toast";
  import type { ComponentType } from "svelte";
  import { Layers3, RotateCw, Settings, Unplug, UsersRound } from "lucide-svelte";
  import Stats from "$lib/components/obs/Stats.svelte";
  import Obs from "$lib/components/icons/OBS.svelte";
  import { invalidate } from "$app/navigation";

  import type { PageData } from "./$types";
  export let data: PageData;
  const obsConnected = data.obs.connectedStore;

  const tools: {
    label: string;
    description: string;
    href: string;
    icon: ComponentType;
    color: {
      text: string;
      bg: string;
    };
  }[] = [
    {
      label: "Overlays",
      description: "Create overlays with ease and bring flair to your streams",
      href: "/breakfast/overlays",
      icon: Layers3,
      color: { text: "#9b4f7b", bg: "#f9d9ec" },
    },
  ];

  let obsPassword = localStorage.getItem("obs.password") ?? data.obs.password;
</script>

<div class="flex flex-col gap-2 overflow-hidden sm:grid sm:grid-cols-2">
  <div class="overflow-hidden rounded-xl border border-gray-200 bg-white">
    <div class="flex items-center gap-x-4 border-b border-gray-900/5 p-6">
      <UsersRound
        class="h-12 w-12 flex-none rounded-lg bg-white object-cover p-2 text-slate-600 ring-1 ring-gray-900/10"
      />
      <div class="text-sm font-medium leading-6 text-gray-900">Community</div>
      <a
        href="/breakfast/community"
        class="-m-2.5 ml-auto block p-2.5 text-gray-400 hover:text-gray-500"
      >
        <span class="sr-only">Open community dashboard</span>
        <Settings />
      </a>
    </div>
    <dl class="-my-3 divide-y divide-gray-100 px-6 py-4 text-sm leading-6">
      <div class="flex justify-between gap-x-4 py-3">
        <dt class="text-gray-500">Viewers</dt>
        <dd class="text-gray-700">
          {#await data.suspense.viewerCount}
            ...
          {:then count}
            {count.total}
          {/await}
        </dd>
      </div>
    </dl>
  </div>
  <div class="overflow-hidden rounded-xl border border-gray-200 bg-white">
    <div class="flex items-center gap-x-4 border-b border-gray-900/5 p-6">
      <Obs
        class="h-12 w-12 flex-none rounded-lg bg-white object-cover p-2 text-slate-600 ring-1 ring-gray-900/10"
      />
      <div class="text-sm font-medium leading-6 text-gray-900">OBS</div>
      <div class="relative ml-auto">
        <a href="/breakfast/obs" class="-m-2.5 block p-2.5 text-gray-400 hover:text-gray-500">
          <span class="sr-only">Open OBS Settings</span>
          <Settings />
        </a>
      </div>
    </div>
    <dl class="-my-3 divide-y divide-gray-100 px-6 py-4 text-sm leading-6">
      <div class="flex justify-between gap-x-4 py-3">
        <dt class="text-gray-500">Status</dt>
        <dd class="text-gray-700">{$obsConnected ? "Connected" : "Not Connected"}</dd>
      </div>
      {#if $obsConnected}
        <Stats shownStats={["webSocketSessionIncomingMessages", "show-more"]} />
      {:else}
        <div class="flex justify-between gap-x-4 py-3">
          <p class="text-gray-500">Connect</p>
          <form
            class="flex items-start gap-x-2"
            on:submit={(ev) => {
              ev.preventDefault();
              toast.promise(
                data.obs.connect(obsPassword).then((result) => {
                  if (result.status == "error") throw result.error;
                  localStorage.setItem("obs.password", obsPassword);
                }),
                {
                  loading: "Connecting to OBS...",
                  success: "OBS Connected! OBS Features are now available.",
                  error: (err) => `Failed to connect to OBS: ${err.message}`,
                },
              );
            }}
          >
            <input
              class="h-6 rounded border border-slate-400 px-1"
              type="password"
              placeholder="Enter Password"
              required
              bind:value={obsPassword}
            />
            <button
              class="rounded-md bg-green-700 px-2 py-1 text-xs font-medium text-white ring-1 ring-inset ring-green-600/10"
              type="submit"
            >
              <Unplug size="1rem" />
            </button>
          </form>
        </div>
        <div class="flex justify-between gap-x-4 py-3">
          <p class="text-gray-500">Need help setting up?</p>
          <a href="/breakfast/obs/wizard" class="rounded bg-slate-700 px-2 text-white">
            Get Started
          </a>
        </div>
      {/if}
    </dl>
  </div>
</div>

<div class="my-4" role="separator" />

<h2 class="mb-3 font-semibold">Tools</h2>
<div class="border-collapse overflow-hidden sm:grid sm:grid-cols-2 sm:gap-1 xl:grid-cols-3">
  {#each tools as tool}
    <div
      class="group relative border bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-slate-500 hover:bg-slate-50 sm:rounded-tr-none"
    >
      <div>
        <span
          class="inline-flex rounded-lg p-3 ring-4 ring-white"
          style:color={tool.color.text}
          style:background-color={tool.color.bg}
        >
          <svelte:component this={tool.icon} class="h-6 w-6" />
        </span>
      </div>
      <div class="mt-8">
        <h3 class="text-base font-semibold leading-6 text-gray-900">
          <a href={tool.href} class="focus:outline-none">
            <!-- Extend touch target to entire panel -->
            <span class="absolute inset-0" aria-hidden="true"></span>
            {tool.label}
          </a>
        </h3>
        <p class="mt-2 text-sm text-gray-500">
          {tool.description}
        </p>
      </div>
    </div>
  {/each}
</div>
