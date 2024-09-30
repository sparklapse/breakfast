<script lang="ts">
  import toast from "svelte-french-toast";
  import clsx from "clsx";
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import { DropdownMenu } from "bits-ui";
  import EllipsisVertical from "lucide-svelte/icons/ellipsis-vertical";
  import { page } from "$app/stores";
  import type {
    BreakfastEvent,
    ChatMessageEvent,
    SubscriptionEvent,
    ActionDefinition,
  } from "@sparklapse/breakfast/overlay";

  export let actions: ActionDefinition[] = [];
  export let onPauseChange: ((paused: boolean) => void) | undefined = undefined;

  let options = {
    pauseOnEnter: true,
  };
  let enterPause = false;
  let interactionPause = false;
  $: pause = (options.pauseOnEnter && enterPause) || interactionPause;
  $: onPauseChange?.(pause);

  let events: { e: (ChatMessageEvent | SubscriptionEvent)[] } = { e: [] };
  onMount(() => {
    const unlisten = $page.data.pb.realtime.subscribe(
      "@breakfast/events",
      (event: BreakfastEvent) => {
        if (event.type === "action") return;
        if (pause) return;

        let { e } = events;
        if (event.type === "chat-message-delete") {
          const idx = e.findIndex(
            (ev) => ev.type == "chat-message" && ev.data.id === event.data.id,
          );
          e[idx] = {
            ...e[idx],
            deleted: true,
          } as ChatMessageEvent;
        } else {
          e.push(event);
          while (e.length > 50) e.shift();
        }
        events = { e };
      },
    );

    return () => {
      unlisten.then((u) => u());
    };
  });
</script>

<div
  class="relative h-full overflow-hidden rounded border border-gray-200 bg-white"
  on:pointerenter={() => {
    enterPause = true;
  }}
  on:pointerleave={() => {
    enterPause = false;
  }}
>
  <ul class="absolute inset-x-0 bottom-2">
    {#each events.e as event}
      <li
        class={clsx([
          "flex items-center justify-between px-2 py-1.5 hover:bg-slate-50",
          event.type === "chat-message" && event.deleted && "bg-red-50 opacity-90",
        ])}
      >
        <div>
          <p class="text-xs leading-none text-slate-400">
            {event.data.channel.displayName} - {event.platform}
          </p>
          {#if event.type === "chat-message"}
            <p class="content-center leading-none">
              <span>
                <span style:color={event.data.color} title={event.data.chatter.displayName}
                  >{event.data.viewer?.displayName || event.data.chatter.displayName}</span
                >:
              </span>
              {#each event.data.fragments as fragment}
                {#if fragment.type === "emote"}
                  <img
                    class="mx-0.5 inline h-6"
                    src={fragment.images.at(-1)?.url}
                    alt={fragment.text}
                  />
                {:else}
                  {fragment.text}
                {/if}
              {/each}
            </p>
          {:else if event.type === "subscription"}
            <p>
              {event.data.viewer?.displayName}
              {event.data.gifted ? "was gifted a sub" : "has subscribed"}!
            </p>
          {/if}
        </div>
        <DropdownMenu.Root
          closeFocus="body"
          onOpenChange={(open) => {
            interactionPause = open;
          }}
        >
          <DropdownMenu.Trigger class="aspect-square text-slate-400 hover:text-slate-700"
            ><EllipsisVertical /></DropdownMenu.Trigger
          >
          <DropdownMenu.Content class="flex flex-col rounded bg-white py-2 shadow" side="left">
            {#if actions.length > 0}
              <DropdownMenu.Label class="px-2 text-xs text-slate-400">Actions</DropdownMenu.Label>
              {#each actions as action}
                {#if action.type === "on-event" && (!action.filter?.length || action.filter?.includes(event.type))}
                  <DropdownMenu.Item
                    class="cursor-pointer px-2 hover:bg-slate-50"
                    on:click={() => {
                      toast.promise(
                        $page.data.pb.breakfast.overlays.action({
                          type: action.type,
                          emit: action.emit,
                          inputs: {},
                          event,
                        }),
                        {
                          loading: "Actioning...",
                          success: "Actioned event!",
                          error: (err) => `Failed to action event: ${err.message}`,
                        },
                      );
                    }}
                  >
                    {action.label}
                  </DropdownMenu.Item>
                {/if}
              {/each}
              <DropdownMenu.Separator class="my-2 border-t border-slate-200" />
            {/if}
            <DropdownMenu.Label class="px-2 text-xs text-slate-400">Event</DropdownMenu.Label>
            {#if event.id === null}
              <DropdownMenu.Item
                class="cursor-pointer px-2 hover:bg-slate-50"
                on:click={() => {
                  toast.promise(
                    $page.data.pb
                      .collection("events")
                      .create({
                        provider: "manually-saved",
                        providerId: null,
                        type: event.type,
                        data: event.data,
                      })
                      .then((record) => {
                        event.id = record.id;
                      }),
                    {
                      loading: "Saving event...",
                      success: "Event saved!",
                      error: (err) => `Failed to save event: ${err.message}`,
                    },
                  );
                }}
              >
                Save Event
              </DropdownMenu.Item>
            {:else}
              <p class="px-2 text-slate-400 hover:bg-slate-50">Event Saved</p>
            {/if}
            {#if event.data?.viewer?.id}
              <DropdownMenu.Item
                href="/breakfast/viewers/{event.data.viewer.id}"
                class="px-2 hover:bg-slate-50">View Viewer</DropdownMenu.Item
              >
            {/if}
            <!-- <DropdownMenu.Item class="px-2 hover:bg-slate-50">Delete</DropdownMenu.Item> -->
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </li>
    {/each}
  </ul>
  <div
    class="absolute inset-x-0 top-0 flex h-6 items-center justify-between bg-slate-700 px-2 text-sm text-white"
  >
    <p>Event Feed</p>
  </div>
  {#if pause}
    <div
      class="absolute left-1/2 top-8 -translate-x-1/2 whitespace-nowrap rounded bg-slate-700 p-2 text-sm text-white shadow"
      transition:fly={{ y: -10, duration: 100 }}
    >
      <p class="text-center">Feed is paused during interaction</p>
    </div>
  {/if}
</div>
