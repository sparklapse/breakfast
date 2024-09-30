<script lang="ts">
  import { fade } from "svelte/transition";
  import { Dialog } from "bits-ui";
  import { X } from "lucide-svelte";

  export let label: string = "Asset";
  export let value: string | undefined = undefined;
  export let onchange: ((asset: string) => void) | undefined = undefined;

  export let getAssets: (
    filter: string,
  ) => Promise<{ label: string; thumb: string; url: string }[]>;
  export let uploadAsset: (file: File) => Promise<string>;
  $$restProps;

  let open = false;
  let search = "";
  $: results = getAssets(search).catch(() => [] as Awaited<ReturnType<typeof getAssets>>);
</script>

<div class="w-full">
  <p>{label}</p>
  <Dialog.Root bind:open>
    <Dialog.Trigger class="w-full truncate rounded border border-slate-400 px-1 text-left bg-white">
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
        class="fixed left-1/2 top-1/2 max-h-48 w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-white p-4 shadow"
        on:pointerdown={(ev) => {
          ev.stopPropagation();
        }}
        transition={fade}
        transitionConfig={{ duration: 100 }}
      >
        <div class="mb-2 flex items-center justify-between">
          <Dialog.Title>Asset Picker</Dialog.Title>
          <Dialog.Close>
            <X class="size-5" />
          </Dialog.Close>
        </div>
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
              uploadAsset(file).then((url) => {
                open = false;
                onchange?.(url);
              });
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
                  onchange?.(asset.url);
                }}
              >
                <img
                  class="row-span-5 h-full w-full overflow-hidden object-cover"
                  src={asset.url}
                  alt={asset.label}
                />
                <p class="w-full truncate text-left text-sm">{asset.label}</p>
              </button>
            {/each}
          </div>
        {/await}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
</div>
