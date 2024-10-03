<script lang="ts">
  export let label: string | undefined = undefined;
</script>

{#if label}
  <p>{label}</p>
{/if}
<div class="flex justify-between w-full gap-2">
  <slot />
</div>
