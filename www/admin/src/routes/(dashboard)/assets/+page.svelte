<script lang="ts">
  import toast from "svelte-french-toast";
  import { fly } from "svelte/transition";
  import { nanoid } from "nanoid";
  import { Ellipsis, PlusSquare } from "lucide-svelte";
  import { DropdownMenu } from "bits-ui";

  import type { PageData } from "./$types";
  export let data: PageData;

  let localAssets = data.suspense.initial.then((i) => i.assets);
  let fileInput: HTMLInputElement;
  let rename = "";

  const upload = (file: File) => {
    toast.promise(
      data.pb
        .collection("assets")
        .create(
          {
            label: file.name,
            asset: file,
          },
          {
            requestKey: nanoid(),
          },
        )
        .then((record) => {
          localAssets = localAssets.then((assets) => [record, ...assets]);
        }),
      {
        loading: `Uploading ${file.name}`,
        success: `${file.name} uploaded!`,
        error: (err) => `Failed to upload ${file.name}: ${err.message}`,
      },
    );
  };

  const uploadFiles = (files: FileList) => {
    for (const file of files) {
      upload(file);
    }
  };

  const focus = (el: HTMLElement) => {
    setTimeout(() => {
      el.focus();
    }, 100);
  };
</script>

<button
  class="mb-4 flex w-full items-center justify-center gap-1 rounded border-2 border-dashed border-slate-400 bg-slate-200 py-5 text-slate-400 hover:bg-slate-300 hover:text-slate-600"
  on:dragover={(ev) => {
    ev.preventDefault();
  }}
  on:drop={(ev) => {
    ev.preventDefault();
    if (ev.dataTransfer?.files) {
    }
    console.log(ev);
  }}
  on:click={() => fileInput.click()}
>
  <p>Upload Image Asset</p>
  <PlusSquare />
</button>
<input
  class="hidden"
  type="file"
  id="upload"
  multiple
  on:input={(ev) => {
    if (ev.currentTarget.files === null) return;
    uploadFiles(ev.currentTarget.files);
  }}
  bind:this={fileInput}
/>

{#await localAssets}
  <p>Loading</p>
{:then assets}
  <ul class="flex flex-wrap gap-2">
    {#each assets as asset, idx}
      <li class="grid size-48 grid-rows-6 rounded border border-slate-400 bg-white p-2 shadow">
        <img
          class="row-span-5 h-full w-full overflow-hidden object-cover"
          src={data.pb.files.getUrl(asset, asset.asset, { thumb: "100x100" })}
          alt={asset.label}
        />
        <div class="flex items-center justify-between overflow-hidden w-full">
          {#if rename === asset.id}
            <input
              class="text-sm leading-6 text-gray-900"
              value={asset.label}
              on:keydown={({ key, currentTarget }) => {
                if (key === "Enter") currentTarget.blur();
              }}
              on:blur={({ currentTarget: { value } }) => {
                if (value !== asset.label) {
                  toast.promise(
                    data.pb.collection("assets").update(asset.id, {
                      label: value,
                    }),
                    {
                      loading: "Renaming asset...",
                      success: "Asset renamed!",
                      error: (err) => `Failed to rename asset: ${err.message}`,
                    },
                  );
                  asset.label = value;
                }
                rename = "";
              }}
              use:focus
            />
          {:else}
            <p class="text-sm leading-6 truncate text-gray-900">{asset.label}</p>
          {/if}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger class="-m-2.5 block p-2.5 text-gray-500 hover:text-gray-900">
              <span class="sr-only">Open options</span>
              <Ellipsis class="h-5 w-5" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              class="w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none"
              transition={fly}
              transitionConfig={{ y: -20, duration: 100 }}
            >
              <DropdownMenu.Item
                class="block cursor-pointer px-3 py-1 text-sm leading-6 text-gray-900"
                on:click={() => {
                  rename = asset.id;
                }}
              >
                Rename
              </DropdownMenu.Item>
              <DropdownMenu.Separator class="border-t border-slate-200" />
              <DropdownMenu.Item
                class="block cursor-pointer px-3 py-1 text-sm leading-6 text-red-900"
                on:click={async () => {
                  await toast.promise(data.pb.collection("assets").delete(asset.id), {
                    loading: "Deleting asset...",
                    success: "Asset deleted!",
                    error: (err) => `Failed to delete asset: ${err.message}`,
                  });
                  assets.splice(idx, 1);
                  localAssets = Promise.resolve(assets);
                }}
              >
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </li>
    {/each}
  </ul>
{/await}
