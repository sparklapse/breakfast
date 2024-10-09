<script lang="ts">
  import { INPUT_EDITORS } from "./inputs/index.js";
  import InputGroupRow from "./helpers/InputGroupRow.svelte";
  import InputList from "./helpers/InputList.svelte";
  import type { InputDefinition, InputDefinitionGroup, InputListDefinition } from "./types.js";

  type Input = $$Generic<InputDefinition>;

  export let inputs: (Input | InputDefinitionGroup<Input> | InputListDefinition)[];
  export let values: Record<string, any> = {};
  export let onchange: ((input: Input, value: any) => void | Promise<void>) | undefined = undefined;
</script>

{#each inputs as input}
  {#if "group" in input}
    <InputGroupRow>
      <svelte:self inputs={input.group} bind:values {onchange} />
    </InputGroupRow>
  {:else if "list" in input}
    <InputList
      label={input.label}
      input={input.list}
      bind:items={values[input.id]}
    />
  {:else if input.type === "asset"}
    <svelte:component
      this={INPUT_EDITORS[input.type]}
      label={input.label}
      options={input.options}
      value={values[input.id]}
      onchange={(value) => {
        values[input.id] = value;
        onchange?.(input, value);
      }}
    />
  {:else}
    <svelte:component
      this={INPUT_EDITORS[input.type]}
      label={input.label}
      options={input.options}
      value={values[input.id]}
      onchange={(value) => {
        values[input.id] = value;
        onchange?.(input, value);
      }}
    />
  {/if}
{/each}
