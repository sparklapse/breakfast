<script lang="ts">
  import { Select } from "bits-ui";
  import { fly } from "svelte/transition";

  export let label: string = "Select";
  export let value: string | undefined = undefined;
  export let options: Partial<{ options: { label: string; value: string }[] }> | undefined =
    undefined;
  export let onchange: ((value: string) => void) | undefined = undefined;
</script>

<div class="w-full">
  <p>{label}</p>
  {#if options?.options}
    <Select.Root
      selected={options.options.find((o) => o.value == value)}
      items={options.options}
      onSelectedChange={(ev) => {
        if (ev?.value) onchange?.(ev.value);
      }}
      portal="body"
    >
      <Select.Trigger class="w-full truncate rounded border border-slate-400 px-1 text-left">
        <Select.Value placeholder="Select an Option" />
      </Select.Trigger>
      <Select.Content transition={fly} transitionConfig={{ y: -10, duration: 100 }}>
        <div
          class="rounded bg-white p-2 shadow"
          on:pointerdown={(ev) => {
            ev.stopPropagation();
          }}
        >
          {#each options.options as option}
            <Select.Item class="cursor-pointer truncate" value={option.value}>
              <Select.ItemIndicator />
              {option.label}
            </Select.Item>
          {/each}
        </div>
      </Select.Content>
    </Select.Root>
  {:else}
    <p class="text-red-900">Error: Select missing options</p>
  {/if}
</div>
