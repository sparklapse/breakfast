<script lang="ts">
  import { page } from "$app/stores";
</script>

<h1>Uh oh</h1>
<p>{$page.error?.message}</p>
