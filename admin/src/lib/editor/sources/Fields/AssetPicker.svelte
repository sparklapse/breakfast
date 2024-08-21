<script lang="ts">
  import toast from "svelte-french-toast";
  import { fade } from "svelte/transition";
  import { Dialog } from "bits-ui";
  import { X } from "lucide-svelte";
  import { page } from "$app/stores";
  import type { BreakfastPocketBase } from "$lib/connections/pocketbase";

  $: pb = $page.data.pb as BreakfastPocketBase;

  export let label: string = "Asset field";
  export let value: string | undefined = undefined;
  // export let options: Partial<{}> | undefined = undefined;
  export let onchange: ((asset: string) => void) | undefined = undefined;

  let open = false;
  let search = "";
  $: results = pb
    .collection("assets")
    .getList(1, 50, { sort: "-created", filter: `label ~ '%${search}%'` })
    .then((query) => query.items)
    .catch(() => {
      // Cancelled request
      return [];
    });
</script>

<div class="w-full">
  <p>{label}</p>
  <Dialog.Root bind:open>
    <Dialog.Trigger class="w-full truncate rounded border border-slate-400 px-1 text-left">
      {value ? value : "Select Asset"}
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay asChild let:builder>
        <div
          class="fixed inset-0 backdrop-blur-sm"
          use:builder.action
          {...builder}
          on:pointerdown={(ev) => {
            ev.stopPropagation();
          }}
          transition:fade={{ duration: 100 }}
        />
      </Dialog.Overlay>
      <Dialog.Content
        class="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-4 shadow"
        on:pointerdown={(ev) => {
          ev.stopPropagation();
        }}
        transition={fade}
        transitionConfig={{ duration: 100 }}
      >
        <Dialog.Title>Asset Picker</Dialog.Title>
        <div class="mb-2 flex items-center justify-between gap-2">
          <input
            class="w-full rounded border border-slate-400 px-1"
            type="text"
            placeholder="Search assets"
            bind:value={search}
          />
          <label class="cursor-pointer rounded bg-slate-700 px-2 text-white" for="upload-asset">
            Upload
          </label>
          <input
            id="upload-asset"
            class="hidden"
            type="file"
            on:input={(ev) => {
              if (!ev.currentTarget.files) return;
              const file = ev.currentTarget.files[0];
              toast.promise(
                pb
                  .collection("assets")
                  .create({ label: file.name, asset: file })
                  .then((record) => {
                    open = false;
                    onchange?.(pb.files.getUrl(record, record.asset));
                  }),
                {
                  loading: "Uploading asset...",
                  success: "Asset uploaded!",
                  error: (err) => `Failed to upload asset: ${err.message}`,
                },
              );
            }}
          />
        </div>
        {#await results}
          <p>Loading...</p>
        {:then assets}
          <div class="flex flex-wrap gap-2">
            {#each assets as asset}
              <button
                class="grid size-24 grid-rows-6 rounded border border-slate-400 bg-white p-2 shadow"
                on:click={() => {
                  open = false;
                  onchange?.(pb.files.getUrl(asset, asset.asset));
                }}
              >
                <img
                  class="row-span-5 h-full w-full overflow-hidden object-cover"
                  src={pb.files.getUrl(asset, asset.asset, { thumb: "100x100" })}
                  alt={asset.label}
                />
                <p class="w-full truncate text-left text-sm">{asset.label}</p>
              </button>
            {/each}
          </div>
        {/await}
        <Dialog.Close class="absolute right-2 top-2 p-2">
          <X />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
</div>
