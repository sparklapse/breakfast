import toast from "solid-toast";
import { Match, Switch, createSignal } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { Clipboard, EyeOff, Settings } from "lucide-solid";
import { pb } from "$app/connections/pocketbase";
import ToasterCard from "$app/components/layouts/ToasterCard";
import { Tooltip } from "@ark-ui/solid";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [showStreamKey, setShowStreamKey] = createSignal(false);

  return (
    <ToasterCard
      title={
        <h1 class="flex gap-2">
          <Settings size="3rem" /> Settings
        </h1>
      }
      actions={
        <>
          {import.meta.env.VITE_FEATURE_EXTERNAL_ACCOUNT_MANAGEMENT === "true" ? (
            <a href={import.meta.env.VITE_EXTERNAL_ACCOUNT_MANAGE} target="_blank">
              Manage account
            </a>
          ) : (
            <button
              onclick={() => {
                pb.authStore.clear();
                navigate("/");
                toast.success("Signed out");
              }}
            >
              Sign Out
            </button>
          )}
        </>
      }
      footer={
        <div class="flex justify-between">
          <A href="/">Back</A>
          <A href="/settings/connections">Connections</A>
        </div>
      }
    >
      <div class="grid grid-cols-2 gap-2 p-2">
        <div class="flex flex-col gap-2">
          <div class="flex justify-between">
            <Tooltip.Root positioning={{ placement: "right" }} openDelay={250} closeDelay={100}>
              <Tooltip.Trigger class="w-fit cursor-default">
                <div class="flex gap-1">
                  <h2 class="text-lg font-bold">Stream Key</h2>
                  <button
                    // class={clsx([settings.loading && "pointer-events-none animate-pulse"])}
                    onclick={() => {
                      const sk = pb.authStore.modelStore()?.streamKey;
                      if (!sk) {
                        toast.error("View key not loaded, try again soon");
                        return;
                      }

                      toast.promise(navigator.clipboard.writeText(sk), {
                        loading: "Copying to clipboard...",
                        success: "View key copied to clipboard!",
                        error: (err) => `Failed to copy view key to clipboard: ${err.message}`,
                      });
                    }}
                  >
                    <Clipboard size="1.25rem" />
                  </button>
                </div>
              </Tooltip.Trigger>
              <Tooltip.Positioner>
                <Tooltip.Content class="z-10 max-w-sm rounded bg-white p-2 shadow-lg">
                  <p>
                    Your stream key is used to access scenes in OBS without needing to sign into
                    brekkie in the browser source.
                  </p>
                </Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
            <button
              class="rounded border border-red-900 bg-red-50 px-2"
              onclick={() => {
                toast.promise(pb.breakfast.scenes.resetStreamKey(), {
                  loading: "Generating new view key...",
                  success: "New view key generated!",
                  error: (err) => `Failed to generate new view key: ${err.message}`,
                });
              }}
            >
              Regenerate
            </button>
          </div>
          <p class="flex justify-center gap-2">
            <Switch>
              <Match when={showStreamKey()}>
                <span class="flex gap-1">
                  <span>{pb.authStore.modelStore()?.streamKey ?? "Loading..."}</span>
                  <button
                    onclick={() => {
                      setShowStreamKey(false);
                    }}
                  >
                    <EyeOff size="1rem" />
                  </button>
                </span>
              </Match>
              <Match when={!showStreamKey()}>
                <span class="relative">
                  <span class="blur-sm">you'll never find the key nyehehe</span>
                  <button
                    class="absolute inset-0 text-center"
                    onclick={() => {
                      setShowStreamKey(true);
                    }}
                  >
                    Click to reveal key
                  </button>
                </span>
              </Match>
            </Switch>
          </p>
        </div>
      </div>
    </ToasterCard>
  );
}
