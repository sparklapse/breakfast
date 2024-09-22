<script lang="ts">
  import { onMount } from "svelte";
  import { Search, PlusCircle } from "lucide-svelte";
  import { page } from "$app/stores";
  import type { Item } from "@sparklapse/breakfast/db";

  export let onclick: ((item: Item) => void) | undefined = undefined;

  let searchTerm = "";
  let inventory: Item[] = [];

  $: filteredInventory = inventory.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  onMount(async () => {
    const initialItems = await $page.data.pb.collection<Item>("items").getFullList();
    inventory = [...inventory, ...initialItems];
  });
</script>

<div class="container mx-auto p-4">
  <div class="mb-4 flex flex-col justify-between gap-4 sm:flex-row">
    <div
      class="flex w-full items-center gap-2 rounded border border-slate-700 bg-white px-2 outline-slate-700 focus-within:outline"
    >
      <Search class="size-4" />
      <input
        type="text"
        placeholder="Search items..."
        class="w-full bg-transparent outline-none"
        bind:value={searchTerm}
      />
    </div>
    <a
      href="/breakfast/items/new"
      class="flex w-full flex-shrink-0 items-center justify-center rounded-md bg-slate-700 px-2 py-1 text-white sm:w-auto"
    >
      <PlusCircle class="mr-2 h-4 w-4" />
      Create item
    </a>
  </div>

  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
    {#each filteredInventory as item (item.id)}
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <svelte:element
        this={onclick ? "button" : "a"}
        href={!onclick ? `/breakfast/items/${item.id}` : undefined}
        on:click={() => {
          onclick?.(item);
        }}
        class="flex flex-col overflow-hidden rounded-lg bg-white shadow"
      >
        <div class="relative aspect-square">
          {#if typeof item.image === "string" && item.image !== ""}
            {@const src = $page.data.pb.files.getUrl(item, item.image, { thumb: "256x256f" })}
            <img {src} alt={item.image} class="absolute inset-0 h-full w-full object-cover" />
          {:else}
            <p>{item.label.replaceAll(" ", "").slice(0, 2).toUpperCase()}</p>
          {/if}
        </div>
        <div class="flex flex-grow flex-col justify-between bg-white p-2 text-left">
          <p class="truncate text-sm font-semibold">{item.label}</p>
          <p class="mt-1 truncate text-xs text-gray-600">{item.description}</p>
        </div>
      </svelte:element>
    {/each}
  </div>

  {#if filteredInventory.length === 0}
    <p class="mt-4 text-center text-gray-500">No items found.</p>
  {/if}
</div>
