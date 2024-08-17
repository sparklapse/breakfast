<script lang="ts">
  import { DropdownMenu } from "bits-ui";
  import type { PageData } from "./$types";
  export let data: PageData;
  const { user } = data;

  let scenes: { id: string; label: string; visibility: "PUBLIC" | "PRIVATE" | "UNLISTED" }[] = [
    ...(data.scenes.initial as any[]),
  ];
</script>

<ul role="list" class="divide-y divide-gray-100">
  {#each scenes as scene}
    <li class="flex items-center justify-between gap-x-6 py-5 first:pt-0 last:pb-0">
      <div class="min-w-0">
        <div class="flex items-start gap-x-3">
          <p class="text-sm font-semibold leading-6 text-gray-900">{scene.label}</p>
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
            >
              <DropdownMenu.Item
                class="block px-3 py-1 text-sm leading-6 text-gray-900"
                href="/breakfast/scenes/edit/{scene.id}"
              >
                Edit
              </DropdownMenu.Item>
              <DropdownMenu.Item class="block px-3 py-1 text-sm leading-6 text-gray-900">
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
              <DropdownMenu.Item href="#" class="block px-3 py-1 text-sm leading-6 text-red-900">
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </div>
    </li>
  {/each}
</ul>
