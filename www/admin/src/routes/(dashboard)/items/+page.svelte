<script lang="ts" context="module">
  const PER_PAGE = 50;
</script>

<script lang="ts">
  import { nanoid } from "nanoid";

  import type { PageData } from "./$types";
  import type { RecordModel } from "pocketbase";
  import type { Item } from "@sparklapse/breakfast/db";
  import { SquarePlus } from "lucide-svelte";
  export let data: PageData;

  let isLoading = true;
  let wontLoad = false;
  let itemsRequest = data.pb
    .collection<RecordModel & Item>("items")
    .getList(1, PER_PAGE, { sort: "-created", requestKey: nanoid() })
    .then((d) => d.items)
    .finally(() => {
      setTimeout(() => {
        isLoading = false;
      }, 100);
    });

  const loader = (el: HTMLElement) => {
    const loadNextPage = async () => {
      if (isLoading || wontLoad) return;
      isLoading = true;
      const { totalItems } = await data.pb
        .collection("items")
        .getList(1, 1, { requestKey: nanoid() });
      const loaded = (await itemsRequest).length;

      if (loaded >= totalItems) {
        wontLoad = true;
        isLoading = false;
        return;
      }

      const currentPage = Math.floor(loaded / PER_PAGE);
      const nextPage = await data.pb
        .collection<RecordModel & Item>("items")
        .getList(currentPage + 1, PER_PAGE)
        .then((d) => d.items);
      itemsRequest = itemsRequest
        .then((items) => [...items, ...nextPage])
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

<div>
  <div class="flex justify-between">
    <h2 class="text-sm font-medium text-gray-500">Items</h2>
    <a
      class="flex items-center gap-1 rounded bg-slate-700 px-2 text-white"
      href="/breakfast/items/new"
    >
      New <SquarePlus size="1rem" />
    </a>
  </div>
  <ul
    role="list"
    class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 xl:grid-cols-5"
  >
    {#await itemsRequest}
      <div>Loading</div>
    {:then items}
      {#each items as item}
        <li>
          <a href="/breakfast/items/{item.id}" class="col-span-1 flex h-14 rounded-md shadow-sm">
            {#if typeof item.image === "string" && item.image !== ""}
              {@const url = data.pb.getFileUrl(item, item.image, { thumb: "256x256f" })}
              <img
                class="flex w-16 flex-shrink-0 items-center justify-center rounded-l-md bg-slate-400 object-cover font-medium"
                style:background-color={item.meta?.color}
                src={url}
                alt={item.image}
              />
            {:else}
              <div
                class="flex w-16 flex-shrink-0 items-center justify-center rounded-l-md bg-slate-400 text-lg font-medium"
                style:background-color={item.meta?.color}
              >
                {item.label.replaceAll(" ", "").slice(0, 2).toUpperCase()}
              </div>
            {/if}
            <div
              class="flex flex-1 items-center justify-between truncate rounded-r-md border-b border-r border-t border-gray-200 bg-white"
            >
              <div class="flex-1 truncate px-4 py-2 text-sm">
                <p class="truncate font-medium text-gray-900 hover:text-gray-600">{item.label}</p>
                <p class="truncate text-gray-500">{item.description}</p>
              </div>
            </div>
          </a>
        </li>
      {:else}
        <li>No items created yet!</li>
      {/each}
    {/await}
  </ul>
</div>
