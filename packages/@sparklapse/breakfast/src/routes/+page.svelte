<script lang="ts">
  import DefinedEditor from "$lib/io/DefinedEditor.svelte";
  import { INPUT_EDITORS } from "$lib/io/inputs/index.js";

  let values: Record<string, any> = {};
</script>

<h1 class="text-xl font-bold">@Sparklapse/breakfast</h1>

<div class="grid grid-cols-2">
  <div>
    <DefinedEditor
      inputs={[
        {
          id: "schema",
          label: "Schema editor",
          list: [
            {
              id: "id",
              type: "text",
              label: "ID",
            },
            {
              id: "type",
              type: "select",
              label: "Type",
              options: { options: Object.keys(INPUT_EDITORS).map((k) => ({ label: k, value: k })) },
            },
            {
              id: "label",
              type: "text",
              label: "Label",
            },
          ],
        },
      ]}
      bind:values
      assetHelpers={{
        getAssets: async () => [],
        uploadAsset: async () => "example",
      }}
    />
  </div>
  <div>
    <DefinedEditor
      inputs={values.schema ?? []}
      assetHelpers={{
        getAssets: async () => [],
        uploadAsset: async () => "example",
      }}
    />
  </div>
</div>
