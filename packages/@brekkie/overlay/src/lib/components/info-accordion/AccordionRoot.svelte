<script lang="ts">
  import { Accordion } from "bits-ui";

  export let multiple: boolean = true;
  export let inititalOpened: string | string[] = "";
</script>

<Accordion.Root value={inititalOpened} {multiple}>
  <slot />
</Accordion.Root>
