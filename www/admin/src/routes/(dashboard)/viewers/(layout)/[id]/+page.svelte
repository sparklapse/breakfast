<script lang="ts">
  import toast from "svelte-french-toast";
  import { fly } from "svelte/transition";
  import { DropdownMenu, Dialog } from "bits-ui";
  import { EllipsisVertical, CirclePlus, Trash2 } from "lucide-svelte";
  import { goto, invalidate } from "$app/navigation";

  import type { PageData } from "./$types";
  import ItemGrid from "$lib/components/items/ItemGrid.svelte";
  import { page } from "$app/stores";
  export let data: PageData;

  const providersArr = data.viewer.providers!.split(",");
  const providerIdsArr = data.viewer.providerIds!.split(",");

  const providers = providersArr.map((p, i) => [p, providerIdsArr[i]] as const);

  let displayName = data.viewer.displayName;
  let renaming = false;
  let verified: boolean = data.viewer.verified;
  let addItemMenu = false;

  const focus = (el: HTMLElement) => {
    setTimeout(() => el.focus(), 100);
  };
</script>

<div class="mb-2 flex items-start justify-between">
  <div class="flex gap-2">
    <div>
      {#await data.suspense.profileItems}
        <img
          class="size-24 flex-none animate-pulse rounded-full bg-gray-50 shadow-lg brightness-150 contrast-75 saturate-[25%]"
          src="/breakfast/profile.jpg"
          alt=""
        />
      {:then items}
        <div class="relative size-24 flex-none overflow-hidden rounded-full bg-gray-50 shadow-lg">
          <img
            class="absolute inset-0"
            src={items.base !== "" ? items.base + "?thumb=512x512f" : "/breakfast/profile.jpg"}
            alt=""
          />
          {#each items.accessories as item}
            <img class="absolute inset-0" src="{item}?thumb=512x512f" alt="" />
          {/each}
        </div>
      {/await}
    </div>
    <div>
      {#if renaming}
        <input
          class="text-xl font-semibold"
          bind:value={displayName}
          on:keydown={(ev) => {
            if (ev.key === "Enter") ev.currentTarget.blur();
          }}
          on:blur={() => {
            renaming = false;
            toast.promise(data.pb.collection("viewers").update(data.viewer.id, { displayName }), {
              loading: "Updating display name...",
              success: "Display name updated!",
              error: (err) => `Failed to update display name: ${err.message}`,
            });
          }}
          use:focus
        />
      {:else}
        <h2 class="text-xl font-semibold">{displayName}</h2>
      {/if}
      <ul class="flex gap-2">
        {#each providers as [provider, id]}
          <li class="underline">
            <a href="/redirect/to-provider/{provider}/{id}" target="_blank">{provider}</a>
          </li>
        {:else}
          <li>No connected providers</li>
        {/each}
      </ul>
    </div>
  </div>
  <DropdownMenu.Root>
    <DropdownMenu.Trigger class="text-slate-700"><EllipsisVertical /></DropdownMenu.Trigger>
    <DropdownMenu.Content
      class="mt-1 w-40 rounded bg-white py-1 shadow-lg"
      align="end"
      transition={fly}
      transitionConfig={{ y: -10, duration: 100 }}
    >
      <DropdownMenu.Item
        class="cursor-pointer px-2 hover:bg-slate-50"
        on:click={() => {
          renaming = true;
        }}>Rename</DropdownMenu.Item
      >
      <DropdownMenu.Separator class="my-2 border-t border-slate-200" />
      <DropdownMenu.Label class="px-2 text-xs text-slate-400">Danger Zone</DropdownMenu.Label>
      {#if verified}
        <DropdownMenu.Item
          class="cursor-pointer px-2 text-red-900 hover:bg-slate-50"
          on:click={() => {
            toast.promise(
              data.pb
                .collection("viewers")
                .update(data.viewer.id, { verified: false })
                .then(() => (verified = false)),
              {
                loading: "Disabling account...",
                success: "Account disabled!",
                error: (err) => `Failed to disable account: ${err.message}`,
              },
            );
          }}>Disable Account</DropdownMenu.Item
        >
      {:else}
        <DropdownMenu.Item
          class="cursor-pointer px-2 text-red-900 hover:bg-slate-50"
          on:click={() => {
            toast.promise(
              data.pb
                .collection("viewers")
                .update(data.viewer.id, { verified: true })
                .then(() => (verified = true)),
              {
                loading: "Enabling account...",
                success: "Account enabled!",
                error: (err) => `Failed to enable account: ${err.message}`,
              },
            );
          }}>Enable Account</DropdownMenu.Item
        >
      {/if}
      <DropdownMenu.Item
        class="cursor-pointer px-2 text-red-900 hover:bg-slate-50"
        on:click={() => {
          toast.promise(
            data.pb
              .collection("viewers")
              .delete(data.viewer.id)
              .then(() => goto("/breakfast/viewers")),
            {
              loading: "Deleting account...",
              success: "Account deleted!",
              error: (err) => `Failed to delete account: ${err.message}`,
            },
          );
        }}>Delete Account</DropdownMenu.Item
      >
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>

<div class="grid md:grid-cols-2 lg:grid-cols-3">
  <div>
    <div class="flex items-center justify-between">
      <h3 class="font-semibold">Items</h3>
      <Dialog.Root bind:open={addItemMenu}>
        <Dialog.Trigger class="flex items-center gap-1 rounded bg-slate-700 px-2 text-white">
          <CirclePlus size="1rem" /> Give Item
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Content
            class="fixed left-1/2 top-1/2 h-[32rem] w-full max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded bg-white p-2 shadow-lg"
          >
            <p>Pick an item</p>
            <ItemGrid
              onclick={(item) => {
                addItemMenu = false;
                toast.promise(
                  data.pb
                    .collection("viewer_items")
                    .create({
                      owner: $page.params.id,
                      item: item.id,
                    })
                    .then(() => invalidate("db:viewer")),
                  {
                    loading: "Giving viewer item...",
                    success: `Viewer given a ${item.label}`,
                    error: (err) => `Failed to give viewer item: ${err.message}`,
                  },
                );
              }}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
    {#await data.suspense.items}
      <p>Loading</p>
    {:then items}
      <ul class="mt-1 divide-y divide-slate-200">
        {#each items as { id, expand: { item } } (id)}
          <li class="flex items-center justify-between py-2">
            <div class="flex items-center gap-2">
              {#if typeof item.image === "string" && item.image !== ""}
                {@const imageUrl = data.pb.files.getUrl(item, item.image, { thumb: "256x256f" })}
                <img class="size-10 object-cover" src={imageUrl} alt={item.image} />
              {:else}
                <p>{item.label.replaceAll(" ", "").slice(0, 2).toUpperCase()}</p>
              {/if}
              <div>
                <p>{item.label}</p>
                <p class="max-w-sm truncate text-sm">{item.description}</p>
              </div>
            </div>
            <button
              on:click={() => {
                toast.promise(
                  data.pb
                    .collection("viewer_items")
                    .delete(id)
                    .then(() => invalidate("db:viewer")),
                  {
                    loading: "Deleting viewer item...",
                    success: "Viewer no longer has the item!",
                    error: (err) => `Failed to delete viewer item: ${err.message}`,
                  },
                );
              }}><Trash2 class="text-red-900" size="1.25rem" /></button
            >
          </li>
        {:else}
          <li>This viewer has nothing :(</li>
        {/each}
      </ul>
    {/await}
  </div>
</div>
