<script lang="ts">
  import clsx from "clsx";
  import toast from "svelte-french-toast";
  import { fly } from "svelte/transition";
  import { DropdownMenu } from "bits-ui";
  import { EllipsisVertical, PlusSquare } from "lucide-svelte";
  import { navigating } from "$app/stores";
  import { goto } from "$app/navigation";
  import { DEFAULT_SCRIPTS } from "$lib/overlay/scripts";

  import type { PageData } from "./$types";
  export let data: PageData;
  const { user } = data;

  let localOverlays = data.suspense.initial.then((i) => i.overlays);
  let rename: string = "";

  const focus = (el: HTMLElement) => {
    setTimeout(() => {
      el.focus();
    }, 100);
  };
</script>

<button
  class="mb-4 flex w-full items-center justify-center gap-1 rounded border-2 border-dashed border-slate-400 bg-slate-200 py-5 text-slate-400 hover:bg-slate-300 hover:text-slate-600"
  on:click={async () => {
    await toast.promise(
      data.pb
        .collection("overlays")
        .create({
          owner: $user?.id,
          label: "Untitled Overlay",
          scripts: [...DEFAULT_SCRIPTS],
          sources: "",
          visibility: "PRIVATE",
        })
        .then((overlay) => goto(`/breakfast/overlays/edit/${overlay.id}`)),
      {
        loading: "Creating new overlay....",
        success: "New overlay created!",
        error: (err) => `Failed to create new overlay: ${err.message}`,
      },
    );
  }}
>
  <p>New Overlay</p>
  <PlusSquare />
</button>

<ul role="list" class="divide-y divide-gray-100">
  {#await localOverlays}
    <p>Loading</p>
  {:then overlays}
    {#if overlays.length === 0}
      <p>No overlays yet!</p>
    {/if}
    {#each overlays as overlay, idx}
      <li
        class={clsx([
          "flex items-center justify-between gap-x-6 py-5 first:pt-0 last:pb-0",
          $navigating?.to?.route.id === "/(dashboard)/overlays/edit/[id]" &&
            $navigating.to.params?.id === overlay.id &&
            "animate-pulse",
        ])}
      >
        <div class="min-w-0">
          <div class="flex items-start gap-x-3">
            {#if rename === overlay.id}
              <input
                class="text-sm font-semibold leading-6 text-gray-900"
                value={overlay.label}
                on:keydown={({ key, currentTarget }) => {
                  if (key === "Enter") currentTarget.blur();
                }}
                on:blur={({ currentTarget: { value } }) => {
                  if (value !== overlay.label) {
                    toast.promise(
                      data.pb.collection("overlays").update(overlay.id, {
                        label: value,
                      }),
                      {
                        loading: "Renaming overlay...",
                        success: "Overlay renamed!",
                        error: (err) => `Failed to rename overlay: ${err.message}`,
                      },
                    );
                    overlay.label = value;
                  }
                  rename = "";
                }}
                use:focus
              />
            {:else}
              <p class="text-sm font-semibold leading-6 text-gray-900">{overlay.label}</p>
            {/if}
          </div>
          <div class="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
            <p class="truncate">{overlay.visibility} | Created by {$user?.username}</p>
          </div>
        </div>
        <div class="flex flex-none items-center gap-x-4">
          <a
            href="/breakfast/overlays/edit/{overlay.id}"
            class="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block"
          >
            Edit Overlay
          </a>
          <div class="relative flex-none">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger class="-m-2.5 block p-2.5 text-gray-500 hover:text-gray-900">
                <span class="sr-only">Open options</span>
                <EllipsisVertical class="h-5 w-5" />
              </DropdownMenu.Trigger>
              <DropdownMenu.Content
                class="w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none"
                transition={fly}
                transitionConfig={{ y: -20, duration: 100 }}
              >
                <DropdownMenu.Item
                  class="block px-3 py-1 text-sm leading-6 text-gray-900"
                  href="/breakfast/overlays/edit/{overlay.id}"
                >
                  Edit
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  class="block cursor-pointer px-3 py-1 text-sm leading-6 text-gray-900"
                  on:click={() => {
                    rename = overlay.id;
                  }}
                >
                  Rename
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  class="block px-3 py-1 text-sm leading-6 text-gray-900"
                  href="/overlays/render/{overlay.id}"
                  target="_blank"
                >
                  View
                </DropdownMenu.Item>
                <DropdownMenu.Separator class="border-t border-slate-200" />
                <DropdownMenu.Item
                  class="block cursor-pointer px-3 py-1 text-sm leading-6 text-red-900"
                  on:click={async () => {
                    await toast.promise(data.pb.collection("overlays").delete(overlay.id), {
                      loading: "Deleting overlay...",
                      success: "Overlay deleted!",
                      error: (err) => `Failed to delete overlay: ${err.message}`,
                    });
                    overlays.splice(idx, 1);
                    localOverlays = Promise.resolve(overlays);
                  }}
                >
                  Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </div>
      </li>
    {/each}
  {/await}
</ul>
