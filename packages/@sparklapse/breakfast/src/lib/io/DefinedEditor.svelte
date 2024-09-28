<script lang="ts">
  import Color from "color";
  import { useEditor } from "$lib/overlay/contexts/editor.js";
  import { INPUT_EDITORS } from "$lib/io/inputs/index.js";
  import InputGroupRow from "./helpers/InputGroupRow.svelte";
  import type { SourceDefinition } from "$lib/overlay/types/script.js";

  export let inputs: SourceDefinition["inputs"];

  const {
    selection: { selectedSource },
    sources: { getSourceTargetValue, updateSourceTargetValue },
  } = useEditor();
</script>

{#each inputs as input}
  {#if "group" in input}
    <InputGroupRow>
      <svelte:self inputs={input.group} />
    </InputGroupRow>
  {:else if $selectedSource}
    <svelte:component
      this={INPUT_EDITORS[input.type]}
      label={input.label}
      options={input.options}
      value={getSourceTargetValue($selectedSource.id, input.target)}
      onchange={(value) => {
        if (value instanceof Color) value = value.hex();
        const formatted = input.format ? input.format.replace("{}", value.toString()) : value;
        if (input.target === "children")
          updateSourceTargetValue($selectedSource.id, input.target, [formatted]);
        else updateSourceTargetValue($selectedSource.id, input.target, formatted);
      }}
    />
  {/if}
{/each}
