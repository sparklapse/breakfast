<script lang="ts">
  import X from "lucide-svelte/icons/x";
  import DefinedEditor from "../DefinedEditor.svelte";
  import type { SvelteProps, InputDefinition } from "../types.js";

  export let label: string = "Select";
  export let input: InputDefinition | InputDefinition[];
  export let items: any[] = [];
</script>

<div class="w-full">
  <p>{label}</p>
  {#each items as item, idx}
    <div class="flex items-start gap-2">
      {#if Array.isArray(input)}
        <div class="w-full">
          <DefinedEditor inputs={input} bind:values={items[idx]} />
        </div>
      {:else}
        <DefinedEditor
          inputs={[input]}
          onchange={(_, value) => {
            items[idx] = value;
          }}
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
