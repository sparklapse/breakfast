import { For, Match, Show, Switch } from "solid-js";
import { produce } from "solid-js/store";
import { Dynamic } from "solid-js/web";
import { Image, Shapes, Menu, Puzzle } from "lucide-solid";
import { siObsstudio } from "simple-icons";
import { Viewport, Component } from "$lib/core/components";
import { useEditor } from "$app/context/editor";
import { TabbedDraw } from "./draws/TabbedDraw";
import { ComponentsDraw as ComponentsDraw } from "./draws/ComponentsDraw";
import { SceneDraw } from "./draws/SceneDraw";
import { MenuDraw } from "./draws/MenuDraw";
import { PluginsDraw } from "./draws/PluginsDraw";
import { OBSDraw } from "./draws/OBSDraw";
import { SelectedTransformEditor } from "./SelectedTransformEditor";
import type { SetStoreFunction } from "solid-js/store";
import type { ComponentSource } from "$lib/core";
import type { EditorComponentSource } from "$app/context/editor/context";

export function Editor() {
  const { editorOptions, components, sources, setSources, markDirty } = useEditor();

  const selected = () => sources.filter((s) => s.editor.selected === true);

  const setTransformValue = (key: keyof EditorComponentSource["transform"], input: string) => {
    const value = parseFloat(input);
    if (Number.isNaN(value)) return;

    markDirty();
    setSources(sources.indexOf(selected()[0]), "transform", key, value);
  };

  return (
    <>
      <Viewport.View
        style={{ "background-color": `hsl(13, 13%, ${editorOptions.backgroundBrightness}%)` }}
        initialZoom={{ width: 1920, height: 1080, x: 1920 / 2, y: 1080 / 2, padding: 100 }}
        before={
          <>
            <Show when={!editorOptions.hideGrid}>
              <Viewport.Grid class="cursor-grab" color="hsl(20, 13%, 40%)" />
            </Show>
          </>
        }
        after={
          <>
            <TabbedDraw
              tabs={[
                {
                  label: "Menu",
                  icon: <Menu class="rotate-90" size="1rem" />,
                  content: <MenuDraw />,
                },
                {
                  label: "Scene",
                  icon: <Image class="rotate-90" size="1rem" />,
                  content: <SceneDraw />,
                },
                {
                  label: "Components",
                  icon: <Shapes class="rotate-90" size="1rem" />,
                  content: <ComponentsDraw />,
                },
                {
                  label: "Plugins",
                  icon: <Puzzle class="rotate-90" size="1rem" />,
                  content: <PluginsDraw />,
                },
                {
                  label: "OBS",
                  icon: <div class="size-4 rotate-90" innerHTML={siObsstudio.svg} />,
                  content: <OBSDraw />,
                },
              ]}
            />
            <Viewport.Controls />
            <div
              class="esc-pan esc-zoom absolute right-2 top-2 flex max-h-[60vh] w-[calc(100%-3.5rem)] max-w-md flex-col gap-1 overflow-y-auto rounded bg-white p-2 shadow max-sm:left-12 max-sm:max-w-none"
              data-component-source-editor
            >
              <Switch>
                <Match when={selected().length === 0}>
                  <p class="text-lg text-zinc-500">Nothing selected...</p>
                </Match>
                <Match when={selected().length === 1}>
                  <div class="flex gap-1 text-lg font-semibold">
                    <p>Editing</p>
                    <input
                      class="w-full border-b-2 border-transparent bg-transparent outline-none transition-colors duration-75 focus:border-zinc-600"
                      type="text"
                      value={selected()[0].label}
                      oninput={(ev) => {
                        markDirty();
                        setSources(sources.indexOf(selected()[0]), "label", ev.currentTarget.value);
                      }}
                    />
                  </div>
                  <hr />
                  <div>
                    <p class="font-bold">Transform</p>
                    <SelectedTransformEditor
                      transform={selected()[0].transform}
                      setTransformValue={setTransformValue}
                    />
                  </div>
                  <div class="mt-2">
                    <p class="font-bold">Data</p>
                    <div class="breakfast-source-editor">
                      <Dynamic
                        component={components()[selected()[0].component]?.editor}
                        data={selected()[0].data}
                        setData={
                          ((...args: [any]) => {
                            markDirty();
                            setSources(sources.indexOf(selected()[0]), "data", ...args);
                          }) as SetStoreFunction<ComponentSource["data"]>
                        }
                      />
                    </div>
                  </div>
                </Match>
                <Match when={selected().length > 1}>
                  <p class="text-lg">{selected().length} sources selected</p>
                </Match>
              </Switch>
            </div>
          </>
        }
      >
        <For each={sources}>
          {(item, index) => (
            <Component.Source
              class="esc-pan"
              component={components()[item.component]?.component}
              transform={item.transform}
              source={item}
              z={sources.length - index()}
            >
              <Show when={item.component === "obs|source" && item.editor.preview}>
                <img
                  class="absolute inset-0 h-full w-full object-contain"
                  src={item.editor.preview}
                />
              </Show>
              <Component.Transformer
                transform={() => sources[index()].transform}
                updateTransform={
                  ((...args: [any]) => {
                    markDirty();
                    setSources(index(), "transform", ...args);
                  }) as SetStoreFunction<ComponentSource["transform"]>
                }
                selected={() => sources[index()].editor.selected}
                updateSelected={(selected) => {
                  setSources(index(), "editor", "selected", selected);
                }}
                remove={() => {
                  markDirty();
                  setSources(
                    produce((prev) => {
                      prev.splice(index(), 1);
                    }),
                  );
                }}
              />
            </Component.Source>
          )}
        </For>
        <div
          class="pointer-events-none absolute h-[1080px] w-[1920px] rounded-[1px] opacity-75 outline outline-[hsl(20,13%,40%)]"
          style={{ "z-index": sources.length + 1 }}
        />
      </Viewport.View>
    </>
  );
}
