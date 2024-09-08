<script lang="ts">
  import { DropdownMenu } from "bits-ui";
  import { EllipsisVertical } from "lucide-svelte";

  import type { PageData } from "./$types";
  import { fly } from "svelte/transition";
  import toast from "svelte-french-toast";
  import { goto } from "$app/navigation";
  export let data: PageData;
</script>

<div class="flex items-start justify-between">
  <div class="flex gap-2">
    {#if typeof data.item.image === "string" && data.item.image !== ""}
      <img
        class="size-32 rounded bg-slate-400 object-cover shadow-lg"
        style:background-color={data.item.meta?.color}
        src={data.pb.files.getUrl(data.item, data.item.image, { thumb: "512x512f" })}
        alt={data.item.image}
      />
    {:else}
      <div
        class="grid size-32 place-content-center rounded bg-slate-400 shadow-lg"
        style:background-color={data.item.meta?.color}
      >
        <p class="text-4xl font-bold">
          {data.item.label.replaceAll(" ", "").slice(0, 2).toUpperCase()}
        </p>
      </div>
    {/if}
    <div>
      <h2 class="text-xl font-semibold">{data.item.label}</h2>
      <p class="max-w-md">{data.item.description}</p>
    </div>
  </div>
  <DropdownMenu.Root>
    <DropdownMenu.Trigger class="text-slate-700"><EllipsisVertical /></DropdownMenu.Trigger>
    <DropdownMenu.Content
      class="mt-1 rounded bg-white py-1 shadow-lg"
      align="end"
      transition={fly}
      transitionConfig={{ y: -10, duration: 100 }}
    >
      <DropdownMenu.Item
        class="cursor-pointer px-2 text-red-900 hover:bg-slate-50"
        on:click={() => {
          toast.promise(
            data.pb
              .collection("items")
              .delete(data.item.id)
              .then(() => goto("/breakfast/items")),
            {
              loading: "Deleting item...",
              success: "Item deleted!",
              error: (err) => `Failed to delete item: ${err.message}`,
            },
          );
        }}>Delete Item</DropdownMenu.Item
      >
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>
