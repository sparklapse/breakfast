<script lang="ts">
  import clsx from "clsx";
  import toast from "svelte-french-toast";
  import { fly } from "svelte/transition";
  import { DropdownMenu } from "bits-ui";
  import { PlusSquare } from "lucide-svelte";
  import { navigating } from "$app/stores";
  import { goto } from "$app/navigation";
  import { CSS_RESET_SCRIPT } from "$lib/editor/scripts/css-reset";

  import type { PageData } from "./$types";
  export let data: PageData;
  const { user } = data;

  let localScenes = data.suspense.initial.then((i) => i.scenes);
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
        .collection("scenes")
        .create({
          owner: $user?.id,
          label: "Untitled Scene",
          scripts: [CSS_RESET_SCRIPT],
          sources: "",
          visibility: "PRIVATE",
        })
        .then((scene) => goto(`/breakfast/scenes/edit/${scene.id}`)),
      {
        loading: "Creating new scene....",
        success: "New scene created!",
        error: (err) => `Failed to create new scene: ${err.message}`,
      },
    );
  }}
>
  <p>New Scene</p>
  <PlusSquare />
</button>

<ul role="list" class="divide-y divide-gray-100">
  {#await localScenes}
    <p>Loading</p>
  {:then scenes}
    {#each scenes as scene, idx}
      <li
        class={clsx([
          "flex items-center justify-between gap-x-6 py-5 first:pt-0 last:pb-0",
          $navigating?.to?.route.id === "/(dashboard)/scenes/edit/[id]" &&
            $navigating.to.params?.id === scene.id &&
            "animate-pulse",
        ])}
      >
        <div class="min-w-0">
          <div class="flex items-start gap-x-3">
            {#if rename === scene.id}
              <input
                class="text-sm font-semibold leading-6 text-gray-900"
                value={scene.label}
                on:keydown={({ key, currentTarget }) => {
                  if (key === "Enter") currentTarget.blur();
                }}
                on:blur={({ currentTarget: { value } }) => {
                  if (value !== scene.label) {
                    toast.promise(
                      data.pb.collection("scenes").update(scene.id, {
                        label: value,
                      }),
                      {
                        loading: "Renaming scene...",
                        success: "Scene renamed!",
                        error: (err) => `Failed to rename scene: ${err.message}`,
                      },
                    );
                    scene.label = value;
                  }
                  rename = "";
                }}
                use:focus
              />
            {:else}
              <p class="text-sm font-semibold leading-6 text-gray-900">{scene.label}</p>
            {/if}
          </div>
          <div class="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
            <p class="truncate">{scene.visibility} | Created by {$user?.username}</p>
          </div>
        </div>
        <div class="flex flex-none items-center gap-x-4">
          <a
            href="/breakfast/scenes/edit/{scene.id}"
            class="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block"
          >
            Edit Scene
          </a>
          <div class="relative flex-none">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger class="-m-2.5 block p-2.5 text-gray-500 hover:text-gray-900">
                <span class="sr-only">Open options</span>
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z"
                  />
                </svg>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content
                class="w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none"
                transition={fly}
                transitionConfig={{ y: -20, duration: 100 }}
              >
                <DropdownMenu.Item
                  class="block px-3 py-1 text-sm leading-6 text-gray-900"
                  href="/breakfast/scenes/edit/{scene.id}"
                >
                  Edit
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  class="block cursor-pointer px-3 py-1 text-sm leading-6 text-gray-900"
                  on:click={() => {
                    rename = scene.id;
                  }}
                >
                  Rename
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  class="block px-3 py-1 text-sm leading-6 text-gray-900"
                  href="/scenes/render/{scene.id}"
                  target="_blank"
                >
                  View
                </DropdownMenu.Item>
                <DropdownMenu.Separator class="border-t border-slate-200" />
                <DropdownMenu.Item
                  class="block cursor-pointer px-3 py-1 text-sm leading-6 text-red-900"
                  on:click={async () => {
                    await toast.promise(data.pb.collection("scenes").delete(scene.id), {
                      loading: "Deleting scene...",
                      success: "Scene deleted!",
                      error: (err) => `Failed to delete scene: ${err.message}`,
                    });
                    scenes.splice(idx, 1);
                    localScenes = Promise.resolve(scenes);
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
