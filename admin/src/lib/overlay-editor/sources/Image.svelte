<script lang="ts">
  import { useEditor } from "$lib/overlay-editor/contexts";
  import AssetPicker from "./Fields/AssetPicker.svelte";
  import FieldRowGroup from "./Fields/FieldRowGroup.svelte";
  import Select from "./Fields/Select.svelte";
  import Text from "./Fields/Text.svelte";

  const {
    sources: { updateSourceField },
    selection: { selectedSource },
  } = useEditor();
</script>

{#if !$selectedSource}
  <p>Error: Source not selected</p>
{:else}
  <AssetPicker
    label="Image"
    value={$selectedSource.props.src}
    onchange={(asset) => {
      updateSourceField($selectedSource.id, "props.src", asset);
    }}
  />
  <FieldRowGroup>
    <Select
      label="Fitting"
      options={{
        options: [
          { label: "Contain", value: "contain" },
          { label: "Cover", value: "cover" },
          { label: "Fill", value: "fill" },
          { label: "Scale Down", value: "scale-down" },
        ],
      }}
      value={$selectedSource.style["object-fit"]}
      onchange={(fit) => {
        updateSourceField($selectedSource.id, "style.object-fit", fit);
      }}
    />
    <Text
      label="Filter"
      value={$selectedSource.style["filter"]}
      onchange={(filter) => {
        updateSourceField($selectedSource.id, "style.filter", filter);
      }}
    />
  </FieldRowGroup>
{/if}
