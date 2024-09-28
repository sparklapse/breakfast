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
  import clsx from "clsx";
  import { onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import "@sparklapse/breakfast/overlay/global";
  import type { ChatMessageEvent } from "@sparklapse/breakfast/io";

  export let overflow: "overflow" | "clip" = "overflow";
  export let removeTime: string = "0";
  export let names: "provider" | "custom" | (string & {}) = "provider";
  $$restProps;

  let messages: { m: ChatMessageEvent[] } = { m: [] };

  $: parsedRemoveTime = parseInt(removeTime);

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
      if (Number.isNaN(parsedRemoveTime) || parsedRemoveTime > 0) {
        setTimeout(() => {
          const { m } = messages;
          const idx = m.findIndex((msg) => msg.data.id === ev.data.id);
          if (idx >= 0) m.splice(idx, 1);
          messages = { m };
        }, parsedRemoveTime || 3000);
      }
    });

    return () => {
      unlisten.then((u) => u());
    };
  });

  const getName = (ev: ChatMessageEvent) =>
    names === "custom"
      ? (ev.data.viewer?.displayName ?? ev.data.chatter.displayName)
      : ev.data.chatter.displayName;

  /**
   * Remove when out of frame
   */
  const removeWhenOOF = (el: HTMLElement, options: { messageId: string }) => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.intersectionRatio < 0.1) {
          const { m } = messages;
          const idx = m.findIndex((msg) => msg.data.id === options.messageId);
          if (idx >= 0) m.splice(idx, 1);
          messages = { m };
        }
      }
    });

    observer.observe(el);

    return {
      destroy: () => {
        observer.disconnect();
      },
    };
  };
</script>

<div class="container" style:overflow={overflow === "overflow" ? "visible" : "clip"}>
  <ul class="messages">
    {#each messages.m as msg (msg.data.id)}
      <p
        class={clsx([msg.deleted && "hidden"])}
        in:fly={{ x: -40, duration: 100 }}
        out:fade={{ duration: 2000 }}
        use:removeWhenOOF={{ messageId: msg.data.id }}
      >
        <span>
          <span style:color={msg.data.color} title={msg.data.chatter.displayName}
            >{msg.data.viewer?.displayName || msg.data.chatter.displayName}</span
          >:
        </span>
        {#each msg.data.fragments as fragment}
          {#if fragment.type === "emote"}
            <img
              style:height="1em"
              style:margin="0 0.125rem"
              src={fragment.images.at(-1)?.url}
              alt={fragment.text}
            />
          {:else}
            {fragment.text}
          {/if}
        {/each}
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
    line-height: 1;
    margin: 0;
    padding: 0;
  }
  p > img {
    display: inline;
  }
  .container {
    position: absolute;
    inset: 0;
  }
  .hidden {
    display: none;
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
