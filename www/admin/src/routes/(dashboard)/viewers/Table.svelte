<script lang="ts" context="module">
  const PER_PAGE = 20;

  const PLATFORMS: { label: string; value: string }[] = [
    {
      label: "Twitch",
      value: "twitch",
    },
  ];
</script>

<script lang="ts">
  import toast from "svelte-french-toast";
  import { fade, fly } from "svelte/transition";
  import { Dialog, Select } from "bits-ui";
  import { ChevronRight, LoaderCircle, Search } from "lucide-svelte";

  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";
  export let data: PageData;

  let search = "";
  let searchResults: ReturnType<typeof data.pb.breakfast.viewers.list> = Promise.resolve([]);

  let searchAbort: (() => void) | undefined;
  const doSearch = () => {
    if (searchAbort) searchAbort();
    searchResults = new Promise((resolve, reject) => {
      setTimeout(resolve, 500);
      searchAbort = () => {
        reject();
      };
    })
      .then(() => data.pb.breakfast.viewers.list(1, 50, search))
      .catch(() => [])
      .finally(() => {
        searchAbort = undefined;
      });
  };
  $: if (search) doSearch();

  let isLoading = true;
  let wontLoad = false;
  let viewersRequest = data.pb.breakfast.viewers.list(1, PER_PAGE).finally(() => {
    setTimeout(() => {
      isLoading = false;
    }, 100);
  });

  let addViewerPlatform: string = "";
  let addViewerUsername: string = "";

  const loader = (el: HTMLElement) => {
    const loadNextPage = async () => {
      if (isLoading || wontLoad) return;
      isLoading = true;
      const { total } = await data.pb.breakfast.viewers.count();
      const loaded = (await viewersRequest).length;

      if (loaded >= total) {
        wontLoad = true;
        isLoading = false;
        return;
      }

      const currentPage = Math.floor(loaded / PER_PAGE);
      const nextPage = await data.pb.breakfast.viewers.list(currentPage + 1, PER_PAGE);
      viewersRequest = viewersRequest
        .then((viewers) => [...viewers, ...nextPage])
        .finally(() => {
          setTimeout(() => {
            isLoading = false;
          }, 100);
        });
    };
    const vision = new IntersectionObserver(loadNextPage, {
      root: document.querySelector("main"),
      rootMargin: "0px",
      threshold: 1.0, // 100%
    });

    vision.observe(el);

    return {
      destroy: () => {
        vision.disconnect();
      },
    };
  };
</script>

<div class="flex items-center justify-between gap-2 text-lg">
  <div
    class="flex w-full items-center gap-2 rounded bg-white px-2 py-1 outline-slate-700 focus-within:outline"
  >
    <Search class="text-slate-700" />
    <input
      class="w-full rounded bg-transparent outline-none"
      type="text"
      placeholder="Search for a viewer"
      bind:value={search}
    />
  </div>

  <div class="flex flex-shrink-0 justify-between gap-1">
    <button
      class="rounded bg-slate-700 px-2 text-white shadow"
      on:click={() => {
        wontLoad = false;
        isLoading = true;
        viewersRequest = data.pb.breakfast.viewers.list(1, PER_PAGE).finally(() => {
          setTimeout(() => {
            isLoading = false;
          }, 100);
        });
      }}>Refresh</button
    >
    <Dialog.Root>
      <Dialog.Trigger class="rounded bg-slate-700 px-2 text-white shadow">Add</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay asChild let:builder>
          <div
            class="fixed inset-0 backdrop-blur-sm"
            use:builder.action
            {...builder}
            transition:fade={{ duration: 100 }}
          />
        </Dialog.Overlay>
        <Dialog.Content
          class="fixed left-1/2 top-1/2 max-h-48 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-4 shadow"
          transition={fly}
          transitionConfig={{ y: 10, duration: 100 }}
        >
          <form
            on:submit={(ev) => {
              ev.preventDefault();

              if (addViewerPlatform == "") return toast.error("Select a platform first");
              if (addViewerUsername == "" || addViewerUsername.includes(" "))
                return toast.error("Enter a valid username");

              toast.promise(
                data.pb.breakfast.viewers
                  .getByProviderUsername(addViewerPlatform, addViewerUsername)
                  .then((v) => goto(`/breakfast/viewers/${v.id}`)),
                {
                  loading: "Adding viewer...",
                  success: "Viewer added!",
                  error: (err) => `Failed to add viewer: ${err.message}`,
                },
              );
            }}
          >
            <Select.Root
              items={PLATFORMS}
              onSelectedChange={(selected) => {
                if (!selected) return;
                addViewerPlatform = selected.value;
              }}
            >
              <Select.Trigger
                class="mt-1 w-full truncate rounded border border-slate-400 bg-white px-2 text-left"
              >
                <Select.Value placeholder="Select a platform" />
              </Select.Trigger>
              <Select.Content class="rounded bg-white py-1 shadow-lg">
                {#each PLATFORMS as platform}
                  <Select.Item class="px-2 hover:bg-slate-50" value={platform.value}
                    >{platform.label}</Select.Item
                  >
                {/each}
              </Select.Content>
            </Select.Root>
            <input
              class="mt-1 w-full truncate rounded border border-slate-400 bg-white px-2 text-left"
              type="text"
              placeholder="Enter a username"
              bind:value={addViewerUsername}
            />
            <button class="float-right mt-2 rounded bg-slate-700 px-2 text-white">Add Viewer</button
            >
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </div>
</div>

<hr class="mt-4 border-gray-200" />
<ul role="list" class="divide-y divide-gray-200">
  {#await search === "" ? viewersRequest : searchResults then viewers}
    {#each viewers as viewer (viewer.id)}
      {@const profileItems = data.pb.breakfast.viewers
        .getProfileItems(viewer.id)
        .catch(() => ({ base: "", accessories: [] }))}
      <li class="relative flex justify-between gap-x-6 px-2 py-5">
        <a href="/breakfast/viewers/{viewer.id}" class="flex min-w-0 gap-x-4">
          {#await profileItems}
            <img
              class="size-12 flex-none animate-pulse rounded-full bg-gray-50 brightness-150 contrast-75 saturate-[25%]"
              src="/breakfast/profile.jpg"
              alt=""
            />
          {:then items}
            <div class="relative size-12 flex-none overflow-hidden rounded-full bg-gray-50">
              <img
                class="absolute inset-0"
                src={items.base !== "" ? items.base + "?thumb=256x256f" : "/breakfast/profile.jpg"}
                alt=""
              />
              {#each items.accessories as item}
                <img class="absolute inset-0" src="{item}?thumb=256x256f" alt="" />
              {/each}
            </div>
          {/await}
          <div class="min-w-0 flex-auto">
            <p class="text-sm font-semibold leading-6 text-gray-900">
              <span class="absolute inset-x-0 -top-px bottom-0"></span>
              {viewer.displayName}
            </p>
            <p class="mt-1 flex text-xs leading-5 text-gray-500">
              {#each viewer.providers.split(",") as provider, idx}
                {#if idx > 0}
                  <span>, </span>
                {/if}
                <span>{provider}</span>
              {/each}
            </p>
          </div>
        </a>
        <div class="flex shrink-0 items-center gap-x-4">
          <ChevronRight class="size-5 flex-none text-gray-400" />
        </div>
      </li>
    {/each}
  {/await}
</ul>
{#if search === ""}
  <p class="mt-4 flex items-center justify-center gap-1 text-sm text-slate-400" use:loader>
    {#if isLoading}
      <LoaderCircle class="animate-spin" size="1rem" />
      <span>Loading...</span>
    {/if}
    {#if wontLoad}
      <span>No more viewers!</span>
    {/if}
  </p>
{/if}
