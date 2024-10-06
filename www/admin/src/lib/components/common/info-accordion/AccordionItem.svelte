<script lang="ts">
  import { slide } from "svelte/transition";
  import { Accordion } from "bits-ui";

  export let value: string;
</script>

<Accordion.Item class="group peer [&+.peer]:data-[state='open']:border-t" {value}>
  <Accordion.Header
    class="relative border-b border-zinc-200 py-2 text-lg hover:bg-slate-50 group-last:border-none"
  >
    <Accordion.Trigger class="absolute inset-0" />
    <slot name="header" />
  </Accordion.Header>
  <Accordion.Content class="py-4" transition={slide} transitionConfig={{ duration: 200 }}>
    <slot />
  </Accordion.Content>
</Accordion.Item>
