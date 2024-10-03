<script lang="ts">
  import X from "lucide-svelte/icons/x";
  import DefinedEditor from "../DefinedEditor.svelte";
  import type { SvelteProps, InputDefinition } from "../types.js";

  export let label: string = "Select";
  export let input: InputDefinition | InputDefinition[];
  export let items: any[] = [];
  export let assetHelpers: SvelteProps<typeof DefinedEditor>["assetHelpers"];
</script>

<div class="w-full">
  <p>{label}</p>
  {#each items as item, idx}
    <div class="flex gap-2 items-start">
      {#if Array.isArray(input)}
        <div class="w-full">
          <DefinedEditor
            inputs={input}
            bind:values={items[idx]}
            {assetHelpers}
          />
        </div>
      {:else}
        <DefinedEditor
          inputs={[input]}
          onchange={(_, value) => {
            items[idx] = value;
          }}
          {assetHelpers}
        />
      {/if}
      <button
        on:click={() => {
          items = items.filter((i) => i !== item);
        }}><X /></button
      >
    </div>
  {/each}
  <button
    on:click={() => {
      const newItem = Array.isArray(input) ? {} : "";
      items = [...items, newItem];
    }}>Add Item</button
  >
</div>
