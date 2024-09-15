<script lang="ts">
  import "@fontsource-variable/gabarito";
  import "./global.pcss";
  import { Toaster } from "svelte-french-toast";
</script>

<svelte:head>
  <title>Breakfast</title>
</svelte:head>

<slot />

<Toaster position="top-center" />
