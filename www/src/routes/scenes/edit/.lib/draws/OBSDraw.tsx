import clsx from "clsx";
import toast from "solid-toast";
import { Switch, Match, createSignal, createResource, For, Show, createEffect } from "solid-js";
import { Portal } from "solid-js/web";
import { useParams } from "@solidjs/router";
import { Dialog, Select } from "@ark-ui/solid";
import { ArrowRight, CheckCircle2, CircleCheck, CircleX, RefreshCw, X } from "lucide-solid";
import { siObsstudio } from "simple-icons";
import { pb } from "$app/connections/pocketbase";
import { useEditor } from "$app/context/editor";
import { useOBS } from "$app/context/obs";
import { BREAKFAST_SCENE_PREFIX, devisPrefix, invisId } from "$lib/obs";

export function OBSDraw() {
  const params = useParams();
  const { saved, save, serialize, id, label, sources } = useEditor();
  const {
    connected,
    connect,
    disconnect,
    port,
    setPort,
    password,
    setPassword,
    syncScene,
    request,
  } = useOBS();
  const [guideOpen, setGuideOpen] = createSignal(false);
  const [guidePage, setGuidePage] = createSignal(0);
  const [selectedScene, setSelectedScene] = createSignal<string[]>(["new"]);
  const [existingScenes, { refetch: refetchExistingScenes, mutate: mutateExistingScenes }] =
    createResource<{ label: string; value: string; disabled?: boolean }[]>(
      async () => {
        if (!connected())
          return [
            {
              label: "Connect to OBS first",
              value: "not-connected",
              disabled: true,
            },
          ];

        const scenes = await request({ type: "GetSceneList", options: undefined });
        if (scenes.status === "error") {
          toast.error(`Failed to get scene list: ${scenes.error.message}`);
          return [
            {
              label: "Failed to get scenes",
              value: "error",
              disabled: true,
            },
          ];
        }

        return scenes.data.scenes
          .map((s) => ({
            label: devisPrefix(s.sceneName),
            value: s.sceneUuid,
          }))
          .filter((s) => devisPrefix(s.label).toLowerCase() !== "ephemeral");
      },
      {
        initialValue: [],
      },
    );
  const scenes = () => [{ label: "New Scene", value: "new" }, ...(existingScenes() ?? [])];

  const sceneToOBS = async () => {
    if (!connected()) {
      try {
        await connect();
      } catch {
        throw new Error("Failed to connect to OBS");
      }
    }

    if (!saved()) await save();

    if (selectedScene().length === 0) throw new Error("Failed to get selected scene");

    let [targetScene] = selectedScene();
    if (targetScene === "new") {
      const newScene = await request({
        type: "CreateScene",
        options: { sceneName: `${BREAKFAST_SCENE_PREFIX}${label()}${invisId()}` },
      });
      if (newScene.status === "error") throw new Error("Failed to create new scene");
      targetScene = newScene.data.sceneUuid;
      mutateExistingScenes((p) => [
        ...p,
        {
          label: `${BREAKFAST_SCENE_PREFIX}${label()}${invisId()}`,
          value: newScene.data.sceneUuid,
        },
      ]);
      setSelectedScene([newScene.data.sceneUuid]);
    }

    const currentScene = await request({ type: "GetSceneList", options: undefined });
    if (currentScene.status === "error") throw new Error("Failed to get scene list");
    const check = currentScene.data.scenes.find((s) => s.sceneUuid === targetScene);
    if (!check) throw new Error("Selected scene doesn't exist");

    let streamKey: string | undefined = pb.authStore.modelStore()?.streamKey;

    await syncScene({
      id: params.id,
      scene: serialize("object"),
      streamKey,
      targetSceneUuid: targetScene,
    });
  };

  createEffect(() => {
    if (!existingScenes()) return;
    if (!connected()) return;
    const loaded = window.localStorage.getItem(`obs-sceneUuid-${id()}`);
    if (loaded) setSelectedScene([loaded]);
  });

  createEffect(() => {
    const [target] = selectedScene();
    if (!connected()) return;
    if (target === "new") return;
    window.localStorage.setItem(`obs-sceneUuid-${id()}`, target);
  });

  return (
    <>
      <h2 class="flex items-center gap-2 text-3xl">
        <div class="size-8" innerHTML={siObsstudio.svg} />
        OBS
      </h2>
      {/* Configuration */}
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1">
          <p>Connection Status:</p>
          <Switch>
            <Match when={connected()}>
              <CircleCheck class="text-green-700" size="1rem" />
            </Match>
            <Match when={!connected()}>
              <CircleX class="text-red-700" size="1rem" />
            </Match>
          </Switch>
        </div>
        <button
          class="rounded border border-black/25 px-2"
          onclick={async () => {
            if (password().trim().length === 0) {
              setGuideOpen(true);
              return;
            }

            if (connected()) disconnect();
            else
              await toast.promise(connect(), {
                loading: "Connecting to OBS...",
                success: "Connected to OBS!",
                error: (err) => `Failed to connect to OBS: ${err.message}`,
              });
          }}
        >
          {connected() ? "Disconnect" : "Connect"}
        </button>
      </div>
      <div class="flex gap-2">
        <div class="flex flex-col">
          <label for="port">Port</label>
          <input
            class="w-full rounded border px-2"
            placeholder="Port"
            type="number"
            name="port"
            value={port()}
            oninput={(ev) => {
              const maybeValue = parseInt(ev.currentTarget.value);
              if (Number.isNaN(maybeValue)) return;

              setPort(maybeValue);
            }}
          />
        </div>
        <div class="flex flex-col">
          <label for="password">Password</label>
          <input
            class="w-full rounded border px-2"
            placeholder="Password"
            type="password"
            name="password"
            value={password()}
            oninput={(ev) => setPassword(ev.currentTarget.value)}
          />
        </div>
      </div>
      {/* Help Dialog */}
      <Dialog.Root
        open={guideOpen()}
        onOpenChange={(ev) => {
          if (ev.open) setGuidePage(0);
          setGuideOpen(ev.open);
        }}
      >
        <Dialog.Trigger class="w-full text-center underline">
          Need help getting setup?
        </Dialog.Trigger>
        <Portal>
          <Dialog.Backdrop class="absolute inset-0 z-10 backdrop-blur backdrop-brightness-50" />
          <Dialog.Positioner class="absolute inset-0 z-20 grid place-content-center">
            <Dialog.Content class="max-w-md rounded bg-white p-2 shadow">
              <div class="flex justify-between">
                <Dialog.Title class="text-lg font-bold">How to find your OBS password</Dialog.Title>
                <Dialog.CloseTrigger>
                  <X />
                </Dialog.CloseTrigger>
              </div>
              <div class="flex h-28 flex-col">
                <Switch>
                  <Match when={guidePage() === 0}>
                    <p>
                      In OBS, select the "Tools" dropdown in the top menubar, then select "WebSocket
                      Server Settings".
                    </p>
                  </Match>
                  <Match when={guidePage() === 1}>
                    <p>
                      Check the "Enable WebSocket server" checkbox if not already enabled. Then
                      under "Server Settings", press the{" "}
                      <span class="whitespace-nowrap">"Show Connect Info"</span> button.
                    </p>
                  </Match>
                  <Match when={guidePage() === 2}>
                    <p>
                      The window that just opened should have your{" "}
                      <span class="whitespace-nowrap">"Server Password"</span> which you can copy
                      and paste into here!
                    </p>
                    <div class="flex justify-between gap-2">
                      <div class="flex w-full flex-col">
                        <label>Password</label>
                        <input
                          class="rounded border"
                          type="password"
                          value={password()}
                          oninput={(ev) => {
                            setPassword(ev.currentTarget.value);
                          }}
                        />
                      </div>
                      <div class="flex w-full flex-col">
                        <label>Connection: {connected() ? "Connected!" : "Not connected"}</label>
                        <button
                          class="rounded border"
                          onclick={() => {
                            if (connected()) {
                              toast.success("Already connected!");
                              return;
                            }

                            toast.promise(connect(), {
                              loading: "Connecting...",
                              success: "Connection successful!",
                              error: (err) => `Failed to connect: ${err.message}`,
                            });
                          }}
                        >
                          Test Connection
                        </button>
                      </div>
                    </div>
                  </Match>
                </Switch>
              </div>
              <div class="flex">
                <Switch>
                  <Match when={guidePage() < 2}>
                    <button
                      class="ml-auto"
                      onclick={() => {
                        setGuidePage((prev) => prev + 1);
                      }}
                    >
                      Next
                    </button>
                  </Match>
                  <Match when={guidePage() >= 2}>
                    <Dialog.CloseTrigger class="ml-auto">Done</Dialog.CloseTrigger>
                  </Match>
                </Switch>
              </div>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
      <div class="h-4" role="separator" />
      {/* Modes */}
      <p class="font-bold">Sync</p>
      <div class="flex flex-col gap-2">
        <div class="grid grid-cols-3 place-items-center">
          <p>
            {sources.length} Source{sources.length > 1 ? "s" : ""}
          </p>
          <ArrowRight />
          <Select.Root
            value={selectedScene()}
            onValueChange={(ev) => {
              setSelectedScene(ev.value);
            }}
            items={scenes()}
            onOpenChange={(ev) => {
              if (!ev.open) return;

              refetchExistingScenes();
            }}
          >
            <Select.Control>
              <Select.Trigger class="w-32 overflow-hidden text-ellipsis whitespace-nowrap rounded border border-black/25 px-2">
                <Select.ValueText
                  class={clsx([selectedScene().includes("new") && " opacity-75"])}
                />
              </Select.Trigger>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content class="z-20 w-44 rounded bg-white py-2 shadow">
                  <For each={scenes()}>
                    {(item) => (
                      <Select.Item
                        class={clsx([
                          "flex items-center gap-2 px-2",
                          item.disabled ? "text-red-900" : "hover:bg-black/5",
                        ])}
                        item={item}
                      >
                        <Select.ItemIndicator>
                          <CheckCircle2 size="1rem" />
                        </Select.ItemIndicator>
                        <Select.ItemText
                          class={clsx([
                            "overflow-hidden text-ellipsis whitespace-nowrap",
                            item.value === "new" && " opacity-75",
                          ])}
                        >
                          {item.label}
                        </Select.ItemText>
                      </Select.Item>
                    )}
                  </For>
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
        </div>
        <div class="flex justify-center">
          <button
            class="flex items-center gap-1 rounded border border-black/25 px-2 text-lg"
            onclick={() => {
              toast.promise(sceneToOBS(), {
                loading: "Importing scene to OBS Program...",
                success: "Scene imported to program!",
                error: (err) => `Failed to import to OBS: ${err.message}`,
              });
            }}
          >
            <RefreshCw size="1rem" />
            Sync
          </button>
        </div>
        <Show when={selectedScene()[0] !== "new"}>
          <p class="text-center text-sm text-red-900">
            This will overwrite all sources in the selected scene
          </p>
        </Show>
      </div>
    </>
  );
}
