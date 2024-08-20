<script lang="ts">
  import { useEditor } from "$lib/editor/contexts";
  import ColorPicker from "./Fields/ColorPicker.svelte";
  import FieldRowGroup from "./Fields/FieldRowGroup.svelte";
  import Number from "./Fields/Number.svelte";
  import Text from "./Fields/Text.svelte";

  const {
    sources: { updateSourceField },
    selection: { selectedSource },
  } = useEditor();

  $: text = typeof $selectedSource?.children[0] === "string" ? $selectedSource.children[0] : "";
</script>

{#if !$selectedSource}
  <p>Error: Source not selected</p>
{:else}
  <Text
    label="Text"
    value={text}
    options={{ multiline: true }}
    onchange={(t) => {
      updateSourceField($selectedSource.id, "children", [t]);
    }}
  />
  <FieldRowGroup>
    <ColorPicker
      label="Color"
      value={$selectedSource.style["color"]}
      onchange={(c) => {
        updateSourceField($selectedSource.id, "style.color", c.hex());
      }}
    />
    <Text
      label="Font Family"
      value={$selectedSource.style["font-family"]}
      onchange={(t) => {
        updateSourceField($selectedSource.id, "style.font-family", t);
      }}
    />
  </FieldRowGroup>
  <FieldRowGroup>
    <Number
      label="Size"
      options={{ min: 0 }}
      value={parseInt($selectedSource.style["font-size"])}
      onchange={(n) => {
        updateSourceField($selectedSource.id, "style.font-size", `${n}px`);
      }}
    />
    <Number
      label="Weight"
      options={{ min: 0, step: 100, max: 1000 }}
      value={parseInt($selectedSource.style["font-weight"])}
      onchange={(n) => {
        updateSourceField($selectedSource.id, "style.font-weight", `${n}`);
      }}
    />
  </FieldRowGroup>
{/if}
