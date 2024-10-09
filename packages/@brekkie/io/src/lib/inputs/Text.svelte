<script lang="ts">
  export let label: string = "Text";
  export let value: string | undefined = undefined;
  export let options: Partial<{ placeholder: string; multiline: boolean }> | undefined = undefined;
  export let onchange: ((text: string) => void) | undefined = undefined;

  const input = (
    ev: Event & {
      currentTarget: EventTarget & (HTMLTextAreaElement | HTMLInputElement);
    },
  ) => {
    onchange?.(ev.currentTarget.value);
  };
</script>

<div class="w-full">
  <p>{label}</p>
  {#if options?.multiline}
    <textarea
      class="w-full rounded border border-slate-400 px-1"
      placeholder={options?.placeholder}
      value={value ?? ""}
      on:input={input}
    />
  {:else}
    <input
      class="w-full rounded border border-slate-400 px-1"
      type="text"
      placeholder={options?.placeholder}
      value={value ?? ""}
      on:input={input}
    />
  {/if}
</div>
