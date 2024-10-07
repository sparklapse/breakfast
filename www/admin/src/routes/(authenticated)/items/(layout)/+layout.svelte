<script lang="ts">
  import { scale } from "svelte/transition";
  import ChevronLeft from "lucide-svelte/icons/chevron-left";
</script>

<slot />
<a
  href="/breakfast/items"
  class="fixed bottom-8 left-8 z-10 flex items-center gap-1 rounded bg-slate-700 px-2 py-1 text-white shadow-lg lg:left-80"
  transition:scale|global={{ start: 0.9, duration: 100 }}
>
  <ChevronLeft class="h-6 w-3" viewBox="6 0 12 24" /> Items
</a>
