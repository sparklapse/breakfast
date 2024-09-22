<script lang="ts">
  import { page } from "$app/stores";
</script>

<div class="absolute inset-0 grid place-content-center">
  <div>
    <h1>Uh Oh</h1>
    <h2>{$page.status}: {$page.error?.message}</h2>
  </div>
</div>
