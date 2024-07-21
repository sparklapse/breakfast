import { For, Show, createMemo, createResource } from "solid-js";
import { loadPluginScript } from "$lib/core";
import { Component } from "$lib/core/components";
import { BUILT_INS } from "$app/builtin";
import type { PluginModule, PluginComponent, Scene } from "$lib/core";

export type EditorProps = {
  scene: Scene;
  indicies?: number[];
};

function ComponentLoading() {
  return <div class="absolute inset-0 animate-pulse bg-slate-700/50" />;
}

export function Viewer(props: EditorProps) {
  const [plugins] = createResource<PluginModule[]>(
    async () => {
      if (props.scene) {
        const result = await Promise.all(
          props.scene.plugins.map(async (s) => {
            const result = await loadPluginScript(s);

            return result;
          }),
        );

        result.forEach((r) => {
          if (r.status === "error") {
            console.error(r.error);
          }
        });

        return [
          ...BUILT_INS,
          ...result.filter((r) => r.status === "success").map((r) => r.plugin!),
        ];
      }

      return [];
    },
    {
      initialValue: [],
    },
  );

  const components = createMemo(() => {
    const out: Record<string, PluginComponent> = {};
    for (const plugin of plugins()) {
      for (const component of plugin.components) {
        const id = `${plugin.id}|${component.id}`;
        out[id] = { ...component, id };
      }
    }
    return out;
  });

  return (
    <For each={props.scene.sources}>
      {(item, index) => (
        <Show
          when={
            item.component !== "obs|source" && (!props.indicies || props.indicies.includes(index()))
          }
        >
          <Component.Source
            class="esc-pan"
            component={plugins.loading ? ComponentLoading : components()[item.component]?.component}
            transform={item.transform}
            source={item}
            z={props.scene.sources.length - index()}
          />
        </Show>
      )}
    </For>
  );
}
