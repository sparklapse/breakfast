import clsx from "clsx";
import toast from "solid-toast";
import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createResource,
  createSignal,
  onCleanup,
} from "solid-js";
import { Portal } from "solid-js/web";
import { Combobox } from "@ark-ui/solid";
import { invisId, invisPrefix } from "$lib/obs";
import { useOBS } from "$app/context/obs";
import Settings from "./settings";
import { Visualize } from "./visualizers";
import type { SetStoreFunction } from "solid-js/store";
import type { ComponentEditorProps, ComponentProps } from "$lib/core";

type Props = {
  kind: string;
  settings: any;
};

function readableName(input: string) {
  return input
    .split("_")
    .map((s) => `${s[0].toUpperCase()}${s.slice(1)}`)
    .join(" ");
}

let kindsSettingsCache: Record<string, any> = {};
export function Editor({ data, setData }: ComponentEditorProps<Props>) {
  const { connected, request } = useOBS();
  const [search, setSearch] = createSignal("");
  const [inputKinds, { refetch: refreshInputKinds }] = createResource(
    async () => {
      const existing = Object.entries(structuredClone(kindsSettingsCache));
      if (existing.length > 0) return existing;

      if (!connected()) return;

      const inputKindsRequest = await request({ type: "GetInputKindList", options: {} });
      if (inputKindsRequest.status === "error") throw new Error("Failed to get input types");

      for (const kind of inputKindsRequest.data.inputKinds) {
        const defaultSettings = await request({
          type: "GetInputDefaultSettings",
          options: { inputKind: kind },
        });
        if (defaultSettings.status === "error")
          throw new Error(`Failed to get default settings for '${kind}' kind`);

        kindsSettingsCache[kind] = defaultSettings.data.defaultInputSettings;
      }

      return Object.entries(structuredClone(kindsSettingsCache));
    },
    {
      initialValue: Object.entries(structuredClone(kindsSettingsCache)),
    },
  );
  const [ephemeralUuid, setEphemeralUuid] = createSignal<string>();

  createEffect(() => {
    if (!data.settings && typeof data.kind === "string" && inputKinds()) {
      const defaultSettings = inputKinds()!.find(([k]) => k === data.kind);
      if (defaultSettings) setData("settings", defaultSettings[1]);
    }
  });

  onCleanup(() => {
    if (ephemeralUuid()) request({ type: "RemoveInput", options: { inputUuid: ephemeralUuid()! } });
  });

  let settingsPoll: ReturnType<typeof setInterval> | undefined;
  const clearEphemeralPoll = async () => {
    if (ephemeralUuid()) request({ type: "RemoveInput", options: { inputUuid: ephemeralUuid()! } });
    if (settingsPoll) clearInterval(settingsPoll);
    settingsPoll = undefined;
    setEphemeralUuid(undefined);
  };

  createEffect(() => {
    if (!ephemeralUuid()) {
      clearEphemeralPoll();
      return;
    }

    settingsPoll = setInterval(async () => {
      if (!ephemeralUuid()) {
        clearEphemeralPoll();
        return;
      }

      const settingsRequest = await request({
        type: "GetInputSettings",
        options: { inputUuid: ephemeralUuid()! },
      });
      if (settingsRequest.status === "error") {
        clearEphemeralPoll();
        toast.error("Failed to poll OBS for new settings");
        return;
      }

      setData("settings", undefined);
      setData("settings", settingsRequest.data.inputSettings);
    }, 500);

    onCleanup(() => {
      clearEphemeralPoll();
    });
  });

  createEffect(() => {
    if (connected()) refreshInputKinds();
  });

  const results = () => {
    const kinds = inputKinds();
    if (!kinds) return [];
    return kinds.filter(([k]) => k.toLowerCase().includes(search().toLowerCase()));
  };

  onCleanup(() => {
    clearEphemeralPoll();
  });

  return (
    <>
      <div class="flex flex-col gap-2">
        <div class="flex justify-between">
          <p>OBS Source Type: {data.kind ? readableName(data.kind) : "Not set"}</p>
          <button
            class={clsx([
              "rounded border px-2",
              (!data.kind || !data.settings || !connected()) && "pointer-events-none opacity-75",
            ])}
            onclick={async () => {
              await request({
                type: "CreateScene",
                options: { sceneName: invisPrefix("Ephemeral") },
              });

              if (ephemeralUuid()) await clearEphemeralPoll();

              const ephemeralInputRequest = await request({
                type: "CreateInput",
                options: {
                  inputKind: data.kind!,
                  inputName: `${readableName(data.kind!)}${invisId()}`,
                  sceneName: invisPrefix("Ephemeral"),
                  sceneItemEnabled: false,
                  inputSettings: data.settings,
                },
              });

              if (ephemeralInputRequest.status === "error") {
                toast.error("Failed to create ephemeral settings input");
                return;
              }

              setEphemeralUuid(ephemeralInputRequest.data.inputUuid);

              toast.promise(
                request({
                  type: "OpenInputPropertiesDialog",
                  options: { inputUuid: ephemeralInputRequest.data.inputUuid },
                }),
                {
                  loading: "Opening OBS...",
                  success: "OBS properties opened!",
                  error: (err) => `Failed to open OBS: ${err.message ?? "unknown"}`,
                },
              );
            }}
          >
            Configure in OBS
          </button>
        </div>
        <Combobox.Root items={results()} openOnChange openOnClick>
          <Combobox.Control>
            <Combobox.Input
              class={clsx([
                inputKinds.loading && "animate-pulse",
                !inputKinds() && "pointer-events-none opacity-50",
              ])}
              placeholder={
                !inputKinds()
                  ? inputKinds.loading
                    ? "Loading..."
                    : "Connect to OBS first"
                  : "Search for a source type to add"
              }
              value={search()}
              onInput={(ev) => {
                setSearch(ev.currentTarget.value);
              }}
              onKeyDown={async (ev) => {
                if (ev.key !== "Enter") return;
                if (results().length === 0) return;

                ev.preventDefault();
                await clearEphemeralPoll();
                setData("settings", undefined);
                setData("settings", results()[0][1]);
                setData("kind", results()[0][0]);
                setSearch("");
              }}
            />
          </Combobox.Control>
          <Portal>
            <Combobox.Positioner data-component-source-editor>
              <Show when={inputKinds()}>
                <Combobox.Content class="max-h-56 overflow-y-auto rounded bg-white py-2 shadow">
                  <For each={results()}>
                    {([key, { settings }]) => (
                      <Combobox.Item
                        class="px-2 hover:bg-black/10"
                        item={key}
                        onClick={async () => {
                          await clearEphemeralPoll();
                          setData("kind", key);
                          setData("settings", undefined);
                          setData("settings", settings);
                        }}
                      >
                        {readableName(key)}
                      </Combobox.Item>
                    )}
                  </For>
                  <Show when={results().length === 0}>
                    <p class="px-2 opacity-75">No results found...</p>
                  </Show>
                </Combobox.Content>
              </Show>
            </Combobox.Positioner>
          </Portal>
        </Combobox.Root>
      </div>
      <Switch>
        <Match when={data.kind && data.settings}>
          <div class={clsx([!connected() && "pointer-events-none select-none opacity-75"])}>
            <Show when={data.settings && data.kind}>
              <Settings
                kind={data.kind!}
                settings={data.settings!}
                setSettings={setData.bind(undefined, "settings") as SetStoreFunction<any>}
              />
            </Show>
          </div>
        </Match>
        <Match when={!data.kind}>
          <p class="opacity-75">Set a source type to change it's settings</p>
        </Match>
      </Switch>
    </>
  );
}

// Define how your component renders as a source
export function Component({ data }: ComponentProps<Props>) {
  return (
    <>
      <Switch>
        <Match when={data.kind && data.settings}>
          <Visualize kind={data.kind!} label={readableName(data.kind!)} settings={data.settings} />
        </Match>
        <Match when={!data.kind}>
          <p class="absolute inset-0 grid place-content-center bg-black/25 text-white">
            Select a source type
          </p>
        </Match>
      </Switch>
    </>
  );
}
