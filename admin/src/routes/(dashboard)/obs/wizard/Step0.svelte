<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";

  export let nextStep: () => void;

  onMount(() => {
    setTimeout(() => {
      nextStep();
    }, 2000);
  });
</script>

<div class="absolute inset-0 grid place-content-center" out:fade={{ duration: 100 }}>
  <div>
    <h2 class="text-xl font-semibold">Hey, let's get OBS setup and connected...</h2>
  </div>
</div>
