<svelte:options
  customElement={{
    tag: "basic-message-highlight",
    shadow: "open",
  }}
/>

<script lang="ts" context="module">
  const EMITS = ["message-highlight", "message-highlight-clear"];
</script>

<script lang="ts">
  import type { ChatMessageEvent } from "@sparklapse/breakfast/overlay";

  import { onMount } from "svelte";
  import { fly } from "svelte/transition";

  /// <reference types="@sparklapse/breakfast/overlay" />

  let message: ChatMessageEvent | undefined = undefined;

  onMount(() => {
    const unlisten = window.breakfast.events.listen((event) => {
      if (event.type !== "action") return;
      if (!EMITS.includes(event.data.emit)) return;

      if (event.data.emit === "message-highlight-clear") {
        message = undefined;
        return;
      }

      if (!event.data.event || event.data.event.type !== "chat-message") return;
      message = event.data.event;
    });

    return () => {
      unlisten.then((u) => u());
    };
  });
</script>

{#key message}
  <div class="container" transition:fly={{ x: -100, duration: 100 }}>
    {#if message}
      <p class="w-fit">
        <span style:color={message.data.color}>{message.data.viewer.displayName}</span>: {message
          .data.text}
      </p>
    {/if}
  </div>
{/key}

<style>
  .container {
    position: absolute;
    inset: 0;
  }

  p {
    color: white;
    margin: 0;
    padding: 0 1rem;
    border-radius: 0.375rem;
    background-color: #2a2a2a;
  }
</style>
