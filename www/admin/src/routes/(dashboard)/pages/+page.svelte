<script lang="ts">
  import toast from "svelte-french-toast";
  import clsx from "clsx";
  import { fly } from "svelte/transition";
  import { DropdownMenu } from "bits-ui";
  import EllipsisVertical from "lucide-svelte/icons/ellipsis-vertical";
  import { navigating } from "$app/stores";

  import type { PageData } from "./$types";
  export let data: PageData;

  const pathRe = /^\/.*\/?$/;
  let newPath = "";
</script>

<div class="mb-4 flex justify-between">
  <h2 class="text-lg font-semibold">Pages</h2>
  <DropdownMenu.Root>
    <DropdownMenu.Trigger class="rounded bg-slate-700 px-2 text-white"
      >New Page</DropdownMenu.Trigger
    >
    <DropdownMenu.Content class="mt-2 rounded bg-white p-2 shadow-lg" align="end">
      <form
        on:submit={(ev) => {
          ev.preventDefault();
          if (!newPath.match(pathRe)) return toast.error("Invalid path");
          if (newPath.startsWith("/breakfast")) return toast.error("Illegal path");
          if (newPath.startsWith("/_")) return toast.error("Illegal path");

          toast.promise(
            data.pb
              .collection("pages")
              .create({ path: newPath, html: "<h1>New Page</h1>" })
              .then((record) => {
                data.pages = [...data.pages, record];
              })
              .then(() => (newPath = "")),
            {
              loading: "Creating new page...",
              success: "Page created!",
              error: (err) => `Failed to create page: ${err.message}`,
            },
          );
        }}
      >
        <input type="text" placeholder="Enter a path" bind:value={newPath} />
        <button class="rounded bg-slate-700 px-2 text-white">Create</button>
      </form>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>

<ul role="list" class="divide-y divide-gray-100">
  {#if data.pages.length === 0}
    <p>No pages yet!</p>
  {/if}
  {#each data.pages as page, idx}
    {@const pageData = Array.isArray(page.data)
      ? (page.data.find((p) => window.navigator.language.startsWith(p.lang)) ?? page.data.at(0))
      : page.data}
    <li
      class={clsx([
        "flex items-center justify-between gap-x-6 py-5 first:pt-0 last:pb-0",
        $navigating?.to?.route.id === "/(dashboard)/pages/edit/[id]" &&
          $navigating.to.params?.id === page.id &&
          "animate-pulse",
      ])}
    >
      <div class="min-w-0">
        <div class="flex items-start gap-x-3">
          <p class="text-sm font-semibold leading-6 text-gray-900">{page.path}</p>
        </div>
        <div class="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
          {#if pageData?.title}
            <p class="truncate">{pageData.title}</p>
          {/if}
        </div>
      </div>
      <div class="flex flex-none items-center gap-x-4">
        <a
          href="/breakfast/pages/edit/{page.id}"
          class="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block"
        >
          Edit Page
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
                href="/breakfast/pages/edit/{page.id}"
              >
                Edit
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="block px-3 py-1 text-sm leading-6 text-gray-900"
                href={page.path}
                target="_blank"
              >
                View
              </DropdownMenu.Item>
              <DropdownMenu.Separator class="border-t border-slate-200" />
              <DropdownMenu.Item
                class="block cursor-pointer px-3 py-1 text-sm leading-6 text-red-900"
                on:click={async () => {
                  await toast.promise(data.pb.collection("pages").delete(page.id), {
                    loading: "Deleting page...",
                    success: "Page deleted!",
                    error: (err) => `Failed to delete page: ${err.message}`,
                  });
                  data.pages.splice(idx, 1);
                  data.pages = data.pages;
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
</ul>
