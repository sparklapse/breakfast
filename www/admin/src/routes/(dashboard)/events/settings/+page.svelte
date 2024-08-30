<script lang="ts">
  import { Select } from "bits-ui";
  import { Check } from "lucide-svelte";

  import type { PageData } from "./$types";
  import toast from "svelte-french-toast";
  export let data: PageData;

  const available = data.types.available.map((a) => ({ value: a }));
  let selected = data.types.saved.map((s) => ({ value: s }));
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
        <dd class="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
          {#await data.pb.breakfast.events.twitch.listSubscriptions()}
            <span>Loading...</span>
          {:then { subscriptions }}
            <ul>
              {#each subscriptions as sub}
                <li>{sub.type}</li>
              {/each}
            </ul>
          {/await}
        </dd>
      </div>
    </dl>
  </div>
</div>
