<script lang="ts" context="module">
  const PER_PAGE = 20;
</script>

<script lang="ts">
  import { ChevronRight, LoaderCircle, Search } from "lucide-svelte";

  import type { PageData } from "./$types";
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

<div
  class="flex items-center gap-2 rounded bg-white px-2 py-1 outline-slate-700 focus-within:outline"
>
  <Search class="text-slate-700" />
  <input
    class="w-full rounded bg-transparent text-lg outline-none"
    type="text"
    placeholder="Search for a viewer"
    bind:value={search}
  />
</div>

<hr class="mt-4 border-gray-200" />
<ul role="list" class="divide-y divide-gray-200">
  {#await search === "" ? viewersRequest : searchResults}
    {#each Array(20) as _, idx}
      <li
        class="relative flex animate-pulse justify-between gap-x-6 bg-gray-200 px-2 py-5 text-transparent"
        style:animation-delay="{idx*200}ms"
      >
        <div class="flex min-w-0 gap-x-4">
          <div class="size-12 flex-none rounded-full bg-gray-400" />
          <div class="min-w-0 flex-auto">
            <p class="text-sm font-semibold leading-6">
              <span class="absolute inset-x-0 -top-px bottom-0"></span>
              Loading
            </p>
            <p class="mt-1 flex text-xs leading-5">Loading</p>
          </div>
        </div>
        <!-- <div class="flex shrink-0 items-center gap-x-4">
        <div class="hidden sm:flex sm:flex-col sm:items-end">
            <p class="text-sm leading-6 text-gray-900">Co-Founder / CEO</p>
            <p class="mt-1 text-xs leading-5 text-gray-500">
              Last seen <time datetime="2023-01-23T13:23Z">3h ago</time>
            </p>
          </div>
        <ChevronRight class="size-5 flex-none text-gray-400" />
      </div> -->
      </li>
    {/each}
  {:then viewers}
    {#each viewers as viewer (viewer.id)}
      <li class="relative flex justify-between gap-x-6 px-2 py-5">
        <a href="/breakfast/community/viewers/{viewer.id}" class="flex min-w-0 gap-x-4">
          <img
            class="size-12 flex-none rounded-full bg-gray-50"
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt=""
          />
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
          <!-- <div class="hidden sm:flex sm:flex-col sm:items-end">
            <p class="text-sm leading-6 text-gray-900">Co-Founder / CEO</p>
            <p class="mt-1 text-xs leading-5 text-gray-500">
              Last seen <time datetime="2023-01-23T13:23Z">3h ago</time>
            </p>
          </div> -->
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
