<script lang="ts">
  import { fade } from "svelte/transition";
  import { Dialog } from "bits-ui";
  import X from "lucide-svelte/icons/x";
  import { useAssetHelpers } from "$lib/context.js";
  import AssetMenu from "$lib/AssetMenu.svelte";
  import type { AssetHelpers } from "$lib/context.js";

  export let label: string = "Asset";
  export let value: string | undefined = undefined;
  export let onchange: ((asset: string) => void) | undefined = undefined;
  $$restProps;

  const helpers = useAssetHelpers();

  let open = false;
  let search = "";
  let results: ReturnType<AssetHelpers["list"]> = Promise.resolve([]);
</script>

<div class="w-full">
  <p>{label}</p>
  {#if helpers}
    <Dialog.Root
      onOpenChange={(state) => {
        if (!state) return;
        results = helpers.list(search).catch(() => []);
      }}
      bind:open
    >
      <Dialog.Trigger
        class="w-full truncate rounded border border-slate-400 bg-white px-1 text-left"
      >
        {value ? value.split("/").at(-1) : "Select Asset"}
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
          class="fixed left-1/2 top-1/2 max-h-72 w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-white p-4 shadow"
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
          <AssetMenu
            onassetpicked={(url) => {
              open = false;
              onchange?.(url);
            }}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  {:else}
    <p>Assets are disabled</p>
  {/if}
</div>
