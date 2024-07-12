import toast from "solid-toast";
import { Match, Show, Switch, createEffect, createResource } from "solid-js";
import { A } from "@solidjs/router";
import { Unplug } from "lucide-solid";
import { pb } from "$app/connections/pocketbase";
import ToasterCard from "$app/components/layouts/ToasterCard";
import { siTwitch } from "simple-icons";
import type { ExternalAuthModel } from "pocketbase";

export default function SettingsPage() {
  const [externalIdentities, { refetch }] = createResource(async () => {
    const userId = pb.authStore.modelStore()?.id as string | undefined;
    if (!userId) return;

    const data = await pb.collection("users").listExternalAuths(userId);

    return data.reduce(
      (acc, next) => {
        return {
          ...acc,
          [next["provider"]]: next,
        };
      },
      {} as Record<string, ExternalAuthModel>,
    );
  });

  createEffect(() => {
    if (pb.authStore.modelStore()) refetch();
  });

  return (
    <ToasterCard
      title={
        <h1 class="flex gap-2">
          <Unplug size="3rem" /> Connections
        </h1>
      }
      footer={<A href="/settings">Back</A>}
    >
      <div class="flex flex-col gap-2 p-2">
        <Show when={!externalIdentities()}>
          <p class="text-center">Loading...</p>
        </Show>
        <Show when={externalIdentities()}>
          {(identities) => (
            <>
              {/* Twitch */}
              <div class="flex justify-between">
                <div class="flex items-center gap-1">
                  <div class="size-4" innerHTML={siTwitch.svg} />
                  <p>Twitch</p>
                </div>
                <div>
                  <Switch>
                    <Match when={!identities().twitch}>
                      <button
                        onclick={async () => {
                          await toast.promise(
                            pb
                              .collection("users")
                              .authWithOAuth2({ provider: "twitch", scopes: ["user:read:chat"] }),
                            {
                              loading: "Linking twitch account...",
                              success: "Account linked!",
                              error: (err) => `Failed to link account: ${err.message}`,
                            },
                          );
                          refetch();
                        }}
                      >
                        Link Twitch
                      </button>
                    </Match>
                    <Match when={identities().twitch}>
                      <button
                        onclick={async () => {
                          const userId = pb.authStore.modelStore()?.id;
                          if (!userId) {
                            toast.error("Not authenticated");
                            return;
                          }
                          await toast.promise(
                            pb.collection("users").unlinkExternalAuth(userId, "twitch"),
                            {
                              loading: "Unlinking twitch account...",
                              success: "Account unlinked!",
                              error: (err) => `Failed to unlink account: ${err.message}`,
                            },
                          );
                          await refetch();
                        }}
                      >
                        Disconnect
                      </button>
                    </Match>
                  </Switch>
                </div>
              </div>
            </>
          )}
        </Show>
      </div>
    </ToasterCard>
  );
}
