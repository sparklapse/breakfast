<script lang="ts">
  import { useEditor } from "$lib/overlay/contexts";
  import { fields } from "./fields";
  import Color from "color";
  import FieldRowGroup from "./helpers/FieldRowGroup.svelte";
  import type { SourceDefinition } from "@sparklapse/breakfast/scripts";

  export let definition: SourceDefinition;

  if ("type" in definition.fields[0]) {
    if (definition.fields[0].type == "number") {
      definition.fields[0].options;
    }
  }

  const {
    selection: { selectedSource },
    sources: { getSourceField, updateSourceField },
  } = useEditor();
</script>

{#each definition.fields as field}
  {#if "group" in field}
    <FieldRowGroup>
      <svelte:self definition={{ ...definition, fields: field.group }} />
    </FieldRowGroup>
  {:else if $selectedSource}
    <svelte:component
      this={fields[field.type]}
      label={field.label}
      options={field.options}
      value={getSourceField($selectedSource.id, field.target)}
      onchange={(value) => {
        if (value instanceof Color) value = value.hex();
        const formatted = field.format ? field.format.replace("{}", value.toString()) : value;
        updateSourceField($selectedSource.id, field.target, formatted);
      }}
    />
  {/if}
{/each}
