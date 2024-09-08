<script lang="ts">
  import toast from "svelte-french-toast";
  import { fly } from "svelte/transition";
  import { DropdownMenu } from "bits-ui";
  import { EllipsisVertical } from "lucide-svelte";

  import type { PageData } from "./$types";
  export let data: PageData;

  const providersArr = data.viewer.providers!.split(",");
  const providerIdsArr = data.viewer.providerIds!.split(",");

  const providers = providersArr.map((p, i) => [p, providerIdsArr[i]] as const);

  let displayName = data.viewer.displayName;
  let renaming = false;
  let verified: boolean = data.viewer.verified;

  const focus = (el: HTMLElement) => {
    setTimeout(() => el.focus(), 100);
  };
</script>

<div class="flex items-start justify-between">
  <div class="flex gap-2">
    <div>
      {#if renaming}
        <input
          class="text-xl font-semibold"
          bind:value={displayName}
          on:keydown={(ev) => {
            if (ev.key === "Enter") ev.currentTarget.blur();
          }}
          on:blur={() => {
            renaming = false;
            toast.promise(data.pb.collection("viewers").update(data.viewer.id, { displayName }), {
              loading: "Updating display name...",
              success: "Display name updated!",
              error: (err) => `Failed to update display name: ${err.message}`,
            });
          }}
          use:focus
        />
      {:else}
        <h2 class="text-xl font-semibold">{displayName}</h2>
      {/if}
      <ul class="flex gap-2">
        {#each providers as [provider, id]}
          <li class="underline">
            <a href="/redirect/to-provider/{provider}/{id}" target="_blank">{provider}</a>
          </li>
        {:else}
          <li>No connected providers</li>
        {/each}
      </ul>
    </div>
  </div>
  <DropdownMenu.Root>
    <DropdownMenu.Trigger class="text-slate-700"><EllipsisVertical /></DropdownMenu.Trigger>
    <DropdownMenu.Content
      class="mt-1 w-40 rounded bg-white py-1 shadow-lg"
      align="end"
      transition={fly}
      transitionConfig={{ y: -10, duration: 100 }}
    >
      <DropdownMenu.Item
        class="cursor-pointer px-2 hover:bg-slate-50"
        on:click={() => {
          renaming = true;
        }}>Rename</DropdownMenu.Item
      >
      {#if verified}
        <DropdownMenu.Item
          class="cursor-pointer px-2 text-red-900 hover:bg-slate-50"
          on:click={() => {
            toast.promise(
              data.pb
                .collection("viewers")
                .update(data.viewer.id, { verified: false })
                .then(() => (verified = false)),
              {
                loading: "Disabling account...",
                success: "Account disabled!",
                error: (err) => `Failed to disable account: ${err.message}`,
              },
            );
          }}>Disable Account</DropdownMenu.Item
        >
      {:else}
        <DropdownMenu.Item
          class="cursor-pointer px-2 text-red-900 hover:bg-slate-50"
          on:click={() => {
            toast.promise(
              data.pb
                .collection("viewers")
                .update(data.viewer.id, { verified: true })
                .then(() => (verified = true)),
              {
                loading: "Enabling account...",
                success: "Account enabled!",
                error: (err) => `Failed to enable account: ${err.message}`,
              },
            );
          }}>Enable Account</DropdownMenu.Item
        >
      {/if}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>
