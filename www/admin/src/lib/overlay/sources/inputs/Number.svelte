<script lang="ts">
  export let label: string = "Number";
  export let value: string | number | undefined = undefined;
  export let options: Partial<{ min: number; max: number; step: number }> | undefined = undefined;
  export let onchange: ((number: number) => void) | undefined = undefined;

  const input = (
    ev: Event & {
      currentTarget: EventTarget & (HTMLTextAreaElement | HTMLInputElement);
    },
  ) => {
    onchange?.(parseFloat(ev.currentTarget.value));
  };
</script>

<div class="w-full">
  <p>{label}</p>
  <input
    class="w-full rounded border border-slate-400 px-1"
    type="number"
    min={options?.min}
    max={options?.max}
    step={options?.step}
    value={typeof value === "string" ? parseFloat(value) : value}
    on:input={input}
  />
</div>
