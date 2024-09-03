<svelte:options
  customElement={{
    tag: "basic-chat",
    shadow: "open",
  }}
/>

<script lang="ts">
  import { onMount } from "svelte";
  import type { ChatEvent } from "@sparklapse/breakfast/overlay";
  import { fade, fly } from "svelte/transition";

  export let removeTime: string = "3000";

  $$restProps;

  let messages: { m: ChatEvent[] } = { m: [] };

  onMount(() => {
    const unlisten = window.breakfast.events.listen((ev) => {
      if (ev.type !== "chat-message") return;

      const { m } = messages;
      m.push(ev);
      messages = { m };
      setTimeout(
        () => {
          const { m } = messages;
          m.shift();
          messages = { m };
        },
        parseInt(removeTime) || 3000,
      );
    });

    return () => {
      unlisten.then((u) => u());
    };
  });
</script>

<reference types="@sparklapse/breakfast/overlay" />

<div class="container">
  {#each messages.m as msg (msg.data.id)}
    <p in:fly={{ x: -40, duration: 100 }} out:fade={{ duration: 2000 }}>
      <span style:color={msg.data.color}>{msg.data.chatter.displayName}</span>: {msg.data.text}
    </p>
  {/each}
</div>

<style>
  :global(:host) {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }
  p {
    margin: 0;
    padding: 0;
  }
  .container {
    position: absolute;
    bottom: 0;
    height: fit-content;
  }
</style>
