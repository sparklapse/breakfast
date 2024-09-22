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
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import type { ChatMessageEvent } from "@sparklapse/breakfast/overlay";

  export let x: "left" | "center" | "right" = "left";
  export let y: "top" | "center" | "bottom" = "top";
  $$restProps;

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
  <div
    class="container"
    style:transform="translateX({x === "center" ? "-50%" : "0"}) translateY({y === "center"
      ? "-50%"
      : "0"})"
    style:top={y === "top" ? 0 : y === "center" ? "50%" : undefined}
    style:left={x === "left" ? 0 : x === "center" ? "50%" : undefined}
    style:bottom={y === "bottom" ? 0 : undefined}
    style:right={x === "right" ? 0 : undefined}
    transition:fly={{ x: -100, duration: 100 }}
  >
    {#if message}
      <p>
        <span style:color={message.data.color}>{message.data.chatter.displayName}</span>: {message
          .data.text}
      </p>
    {/if}
  </div>
{/key}

<style>
  .container {
    position: absolute;
  }

  p {
    color: white;
    margin: 0;
    padding: 0 1rem;
    width: fit-content;
    border-radius: 0.375rem;
    background-color: #2a2a2a;
    box-shadow:
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1);
  }
</style>
