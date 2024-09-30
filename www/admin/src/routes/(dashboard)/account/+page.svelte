<script lang="ts">
  import clsx from "clsx";
  import toast from "svelte-french-toast";
  import Eye from "lucide-svelte/icons/eye";
  import EyeOff from "lucide-svelte/icons/eye-off";
  import { invalidate, invalidateAll } from "$app/navigation";

  import type { PageData } from "./$types";
  export let data: PageData;
  const { user } = data;

  let showStreamKey = false;
</script>

<div>
  <div class="flex items-center justify-between px-4 sm:px-0">
    <h2 class="text-base font-semibold text-gray-900">Account</h2>
    <button
      on:click={() => {
        data.pb.authStore.clear();
        toast.success("Signed out!");
        invalidateAll();
      }}
    >
      Sign Out
    </button>
  </div>
  <div class="mt-6 border-t border-gray-200">
    <dl class="divide-y divide-gray-200">
      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
        <dt class="text-sm leading-6 text-gray-900">Username</dt>
        <dd class="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
          {$user?.username}
        </dd>
      </div>
      <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
        <dt class="text-sm leading-6 text-gray-900">Stream Key</dt>
        <div
          class="mt-1 flex items-center justify-between text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0"
        >
          <div class="flex items-center gap-2">
            <dd class={clsx(["font-mono", !showStreamKey && "select-none blur-sm"])}>
              {showStreamKey ? $user?.streamKey : "hehenokeytoseehereaha"}
            </dd>
            <button
              on:click={() => {
                showStreamKey = !showStreamKey;
              }}
            >
              {#if showStreamKey}
                <EyeOff size="1.25rem" />
              {:else}
                <Eye size="1.25rem" />
              {/if}
            </button>
          </div>
          <button
            class="rounded bg-red-50 px-4 text-red-900"
            on:click={() => {
              toast.promise(data.pb.breakfast.resetStreamKey(), {
                loading: "Resetting stream key",
                success: "Stream key reset!",
                error: (err) => `Failed to reset stream key: ${err.message}`,
              });
            }}
          >
            Reset
          </button>
        </div>
      </div>
      {#await data.suspense.identities}
        <p>Loading</p>
      {:then identities}
        <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt class="text-sm leading-6 text-gray-900">Twitch Account</dt>
          <div
            class="mt-1 flex items-center justify-between text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0"
          >
            <dd>
              {identities.twitch ? identities.twitch.providerId : "Not Linked"}
            </dd>
            <button
              class="rounded bg-purple-900 px-4 text-white"
              on:click={() => {
                if (identities.twitch) {
                  if (!$user) return;
                  toast.promise(
                    data.pb
                      .collection("users")
                      .unlinkExternalAuth($user.id, "twitch")
                      .then(() => invalidate("pb:account")),
                    {
                      loading: "Unlinking account...",
                      success: "Unlinked twitch account!",
                      error: (err) => `Failed to unlink twitch account: ${err.message}`,
                    },
                  );
                  return;
                }

                toast.promise(
                  data.pb.breakfast.auth.sso.twitch().then(() => invalidate("pb:account")),
                  {
                    loading: "Linking twitch account",
                    success: "Twitch account linked!",
                    error: (err) => `Failed to link twitch: ${err.message}`,
                  },
                );
              }}
            >
              {identities.twitch ? "Unlink" : "Link"}
            </button>
          </div>
        </div>
      {/await}
    </dl>
  </div>
</div>
