<script lang="ts">
  export let label: string | undefined = undefined;
</script>

{#if label}
  <p>{label}</p>
{/if}
<div class="flex w-full justify-between gap-2">
  <slot />
</div>
