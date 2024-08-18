<script lang="ts">
  import "@fontsource-variable/gabarito";
  import "./global.pcss";
  import { Toaster } from "svelte-french-toast";
</script>

<slot />

<Toaster position="top-center" />
