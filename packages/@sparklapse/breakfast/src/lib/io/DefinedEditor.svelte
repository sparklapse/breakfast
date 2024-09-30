<script lang="ts">
  import { INPUT_EDITORS } from "./inputs/index.js";
  import InputGroupRow from "./helpers/InputGroupRow.svelte";
  import type { InputDefinition, InputDefinitionGroup } from "./types.js";

  type Input = $$Generic<InputDefinition>;

  export let inputs: (Input | InputDefinitionGroup<Input>)[];
  export let values: Record<string, any>;
  export let onchange: ((input: Input, value: any) => void | Promise<void>) | undefined = undefined;
  export let assetHelpers: {
    getAssets: (filer: string) => Promise<{label: string; thumb: string; url: string}[]>;
    uploadAsset: (file: File) => Promise<string>;
  };
</script>

{#each inputs as input}
  {#if "group" in input}
    <InputGroupRow>
      <svelte:self inputs={input.group} />
    </InputGroupRow>
  {:else}
    {#if input.type === "asset"}
      <svelte:component
        this={INPUT_EDITORS[input.type]}
        label={input.label}
        options={input.options}
        value={values[input.id]}
        onchange={(value) => {
          onchange?.(input, value);
        }}
        getAssets={assetHelpers.getAssets}
        uploadAsset={assetHelpers.uploadAsset}
      />
    {:else}
      <svelte:component
        this={INPUT_EDITORS[input.type]}
        label={input.label}
        options={input.options}
        value={values[input.id]}
        onchange={(value) => {
          onchange?.(input, value);
        }}
      />
    {/if}
  {/if}
{/each}

