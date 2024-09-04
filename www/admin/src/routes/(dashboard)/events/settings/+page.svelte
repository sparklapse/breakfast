<script lang="ts">
  import toast from "svelte-french-toast";
  import { Dialog, Select } from "bits-ui";
  import { Check, Trash2, X } from "lucide-svelte";
  import { invalidate } from "$app/navigation";

  import type { PageData } from "./$types";
  export let data: PageData;

  const available = data.types.available.map((a) => ({ value: a }));
  let selected = data.types.saved.map((s) => ({ value: s }));

  let twitchCreateDialogOpen = false;

  const twitchEventSubTypes = [
    {
      label: "Chat Message",
      value: "channel.chat.message",
    },
  ];

  const createSubscription = (
    ev: SubmitEvent & {
      currentTarget: EventTarget & HTMLFormElement;
    },
  ) => {
    ev.preventDefault();
    const form = new FormData(ev.currentTarget);
    const subscriptionType = form.get("type") as string | null;
    const broadcasterLogin = (form.get("broadcasterLogin") as string | null)?.toLowerCase();

    if (!subscriptionType || !broadcasterLogin) {
      toast.error("Missing required fields");
      return;
    }

    toast.promise(
      data.pb.breakfast.events.twitch
        .createSubscription({
          type: subscriptionType,
          data: { broadcasterLogin },
        })
        .then(() => invalidate("db:events"))
        .then(() => (twitchCreateDialogOpen = false)),
      {
        loading: "Creating subscription...",
        success: "Subscription created!",
        error: (err) => `Failed to create subscription: ${err.message}`,
      },
    );
  };
</script>

<h2 class="font-semibold">Event Settings</h2>

<div>
  <div class="mt-6 border-t border-gray-200">
    <dl class="divide-y divide-gray-200">
      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
        <dt class="text-sm leading-6 text-gray-900">Stored duration</dt>
        <dd class="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
          <input
            class="rounded border border-slate-400 px-1"
            type="text"
            value={data.duration}
            on:keydown={(ev) => {
              if (ev.key === "Enter") {
                ev.preventDefault();
                ev.currentTarget.blur();
              }
            }}
            on:blur={(ev) => {
              toast.promise(data.pb.breakfast.events.setStoredDuration(ev.currentTarget.value), {
                loading: "Saving event storage duration",
                success: "Event storage duration updated!",
                error: (err) => `Failed to update storage duration: ${err.message}`,
              });
            }}
          />
        </dd>
      </div>
      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
        <dt class="text-sm leading-6 text-gray-900">Saved Types</dt>
        <dd class="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
          <Select.Root
            items={available}
            bind:selected
            multiple
            onOpenChange={(open) => {
              if (open) return;
              toast.promise(data.pb.breakfast.events.setSavedTypes(selected.map((s) => s.value)), {
                loading: "Saving event types setting...",
                success: "Event types saved!",
                error: (err) => `Failed to save event types: ${err.message}`,
              });
            }}
          >
            <Select.Trigger
              class="w-full max-w-xs truncate rounded border border-slate-400 bg-white px-1 text-left"
            >
              {#if selected.length === 0}
                <span>Select event types to save</span>
              {:else}
                <span>({selected.length} type{selected.length !== 1 ? "s" : ""} saved)</span>
              {/if}
              {#each selected as s, idx}
                <span>{s.value}{idx !== selected.length - 1 ? ", " : ""}</span>
              {/each}
            </Select.Trigger>
            <Select.Content class="gap-1 rounded bg-white p-2 shadow">
              {#each data.types.available as t}
                <Select.Item class="flex cursor-pointer items-center" value={t}>
                  <Select.ItemIndicator><Check size="1rem" /></Select.ItemIndicator>
                  {t}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if selected.map((s) => s.value).includes("chat-message")}
            <p class="text-xs text-red-900">
              Warning: Saving every message can fill up storage quickly if abused
            </p>
          {/if}
        </dd>
      </div>
      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
        <h3 class="text-sm font-semibold">Twitch EventSub</h3>
      </div>
      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
        <dt class="text-sm leading-6 text-gray-900">Subscriptions</dt>
        <div>
          <div class="flex items-center gap-4">
            <Dialog.Root bind:open={twitchCreateDialogOpen}>
              <Dialog.Trigger class="text-sm underline">Add Subscription</Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay class="fixed inset-0 backdrop-blur-sm backdrop-brightness-95" />
                <Dialog.Content
                  class="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded bg-white p-4 shadow"
                >
                  <div class="mb-2 flex items-center justify-between">
                    <h3>New Subscription</h3>
                    <Dialog.Close><X size="1.25rem" /></Dialog.Close>
                  </div>
                  <form class="flex flex-col gap-2" on:submit={createSubscription}>
                    <Select.Root name="type" items={twitchEventSubTypes} required>
                      <Select.Input class="hidden" />
                      <Select.Trigger
                        class="w-full truncate rounded border border-slate-400 bg-white px-1 text-left"
                      >
                        <Select.Value placeholder="Select an event" />
                      </Select.Trigger>
                      <Select.Content class="gap-1 rounded bg-white p-2 shadow">
                        {#each twitchEventSubTypes as t}
                          <Select.Item value={t.value}>{t.label}</Select.Item>
                        {/each}
                      </Select.Content>
                    </Select.Root>
                    <input
                      class="w-full truncate rounded border border-slate-400 bg-white px-1 text-left"
                      type="text"
                      name="broadcasterLogin"
                      placeholder="Enter account username"
                      required
                    />
                    <button class="rounded bg-slate-700 text-white" type="submit">
                      Create Subscription
                    </button>
                  </form>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <button
              class="text-sm underline"
              on:click={() => {
                toast.promise(
                  data.pb.breakfast.events.twitch
                    .resubscribeDefaults()
                    .then(() => invalidate("db:events")),
                  {
                    loading: "Resubscribing default twitch events...",
                    success: "Events resubscribed successfully!",
                    error: (err) => `Failed to resubscribe events: ${err.message}`,
                  },
                );
              }}>Resubscribe Defaults</button
            >
          </div>
          <dd class="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {#await data.suspense.twitchEventsubList}
              <span>Loading...</span>
            {:then subscriptions}
              <ul>
                {#each subscriptions as sub}
                  <li class="flex items-center justify-between">
                    <span>
                      {sub.config.type} - {sub.config.condition.broadcaster_user_id ??
                        sub.config.condition.user_id}
                    </span>
                    <button
                      class="text-red-900"
                      on:click={() => {
                        toast.promise(
                          data.pb.breakfast.events.twitch
                            .deleteSubscription(sub.id)
                            .then(() => invalidate("db:events")),
                          {
                            loading: "Deleting event subscription...",
                            success: "Event subscription deleted!",
                            error: (err) => `Failed to delete event subscription: ${err.message}`,
                          },
                        );
                      }}><Trash2 size="0.75rem" /></button
                    >
                  </li>
                {/each}
              </ul>
            {/await}
          </dd>
        </div>
      </div>
      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
        <dt class="text-sm leading-6 text-gray-900">Pools</dt>
        <dd class="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
          {#await data.pb.breakfast.events.twitch.listPools()}
            <span>Loading...</span>
          {:then pools}
            <ul>
              {#each Object.entries(pools) as [id, pool]}
                <li>{id} - {pool.status} ({pool.subscriptions})</li>
              {/each}
            </ul>
          {/await}
        </dd>
      </div>
    </dl>
  </div>
</div>
