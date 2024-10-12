<script lang="ts">
  import Trash from "lucide-svelte/icons/trash-2";
  import { useAssetHelpers } from "./context.js";

  export let onassetpicked: ((url: string) => Promise<void> | void) | undefined = undefined;

  const helpers = useAssetHelpers();

  let search: string = "";
  $: assetsProm = helpers?.list(search) ?? Promise.resolve([]);
</script>

{#if !helpers}
  <p>No asset helpers</p>
{:else}
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
        helpers.upload(file).then((url) => {
          onassetpicked?.(url);
        });
      }}
    />
  </div>
  <div class="flex flex-wrap gap-2">
    {#await assetsProm}
      <p>Loading...</p>
    {:then assets}
      {#each assets as asset}
        <button
          class="flex h-fit flex-col gap-1 rounded border border-slate-400 bg-white p-2 shadow"
          on:click={() => {
            onassetpicked?.(asset.url);
          }}
        >
          <img
            class="row-span-5 size-24 overflow-hidden object-contain"
            src={asset.url}
            alt={asset.label}
          />
          <div class="flex w-full justify-between">
            <p class="w-20 truncate text-left text-sm">{asset.label}</p>
            {#if helpers.delete}
              <button
                class="text-red-900"
                on:click={async (ev) => {
                  ev.stopPropagation();
                  await helpers.delete?.(asset.id);
                  assetsProm = helpers.list(search);
                }}
              >
                <Trash size="1rem" />
              </button>
            {/if}
          </div>
        </button>
      {/each}
    {/await}
  </div>
{/if}
