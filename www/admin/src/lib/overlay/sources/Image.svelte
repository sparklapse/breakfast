<script lang="ts">
  import { useEditor } from "$lib/overlay/contexts";
  import FieldRowGroup from "./helpers/FieldRowGroup.svelte";
  import AssetPicker from "./fields/AssetPicker.svelte";
  import Select from "./fields/Select.svelte";
  import Text from "./fields/Text.svelte";

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
