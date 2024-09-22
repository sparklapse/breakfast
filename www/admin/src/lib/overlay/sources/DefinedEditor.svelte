<script lang="ts">
  import Color from "color";
  import { useEditor } from "$lib/overlay/contexts";
  import InputGroupRow from "./helpers/InputGroupRow.svelte";
  import { SOURCE_INPUTS } from "./inputs";
  import type { SourceDefinition } from "@sparklapse/breakfast/scripts";

  export let inputs: SourceDefinition<typeof SOURCE_INPUTS>["inputs"];

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
      this={SOURCE_INPUTS[input.type]}
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
