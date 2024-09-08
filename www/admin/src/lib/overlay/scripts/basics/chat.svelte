<svelte:options
  customElement={{
    tag: "basic-chat",
    shadow: "open",
  }}
/>

<script lang="ts" context="module">
  const COMMON_BOTS = ["streamlabs", "streamelements", "nightbot", "wizebot", "moobot", "fossabot"];
</script>

<script lang="ts">
  import { onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import type { ChatMessageEvent } from "@sparklapse/breakfast/overlay";
  import clsx from "clsx";

  /// <reference types="@sparklapse/breakfast/overlay" />

  export let overflow: "overflow" | "clip" = "overflow";
  export let removeTime: string = "3000";
  export let names: "provider" | "custom" | (string & {}) = "provider";

  $$restProps;

  let messages: { m: ChatMessageEvent[] } = { m: [] };

  onMount(() => {
    const unlisten = window.breakfast.events.listen((ev) => {
      if (ev.type === "chat-message-delete") {
        const { m } = messages;
        const idx = m.findIndex((msg) => msg.data.id === ev.data.id);
        if (idx !== -1) {
          m[idx] = {
            ...m[idx],
            deleted: true,
          };
        }
        messages = { m };
        return;
      }
      if (ev.type !== "chat-message") return;
      if (COMMON_BOTS.includes(ev.data.chatter.username)) return;

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

  const getName = (ev: ChatMessageEvent) =>
    names === "custom" ? ev.data.chatter.viewer.displayName : ev.data.chatter.displayName;
</script>

<div class="container" style:overflow={overflow === "overflow" ? "visible" : "clip"}>
  <ul class="messages">
    {#each messages.m as msg (msg.data.id)}
      <p
        class={clsx([msg.deleted && "hidden"])}
        in:fly={{ x: -40, duration: 100 }}
        out:fade={{ duration: 2000 }}
      >
        <span style:color={msg.data.color}>{getName(msg)}</span>: {msg.data.text}
      </p>
    {/each}
  </ul>
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
    inset: 0;
  }
  .messages {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: fit-content;
    margin: 0;
    padding: 0;
  }
</style>
