import { createEffect, createMemo, createSignal } from "solid-js";
import { loadPluginScript } from "$lib/core";
import { createStore, unwrap } from "solid-js/store";
import { useDevMode } from "./dev-mode";
import type { PluginComponent, ComponentSource, PluginModule, Scene } from "$lib/core";

export type EditorComponentSource = ComponentSource & {
  editor: {
    selected: boolean;
    preview?: string;
  };
};

export type EditorOptions = {
  readOnly: boolean;
  hideGrid: boolean;
  backgroundBrightness: number;
};

export type EditorContextOptions = {
  sceneId?: string;
  builtins?: (PluginModule & { builtin: true })[];
  readOnly?: boolean;
  saver?: () => Promise<void>;
};

export function createEditorContext(options?: EditorContextOptions) {
  // MARK: Editor Options
  const [editorOptions, setEditorOptions] = createStore<EditorOptions>({
    readOnly: options?.readOnly === true,
    hideGrid: localStorage.getItem("editorOptions.hideGrid") === "true",
    backgroundBrightness:
      parseInt(localStorage.getItem("editorOptions.backgroundBrightness") ?? "") || 91,
  });

  createEffect(() => {
    localStorage.setItem("editorOptions.hideGrid", JSON.stringify(editorOptions.hideGrid));
  });

  createEffect(() => {
    localStorage.setItem(
      "editorOptions.backgroundBrightness",
      JSON.stringify(editorOptions.backgroundBrightness),
    );
  });

  // MARK: Identifiers
  const [id, setId] = createSignal<string | undefined>(options?.sceneId);
  const [label, setLabel] = createSignal("Untitled Scene");

  // MARK: Plugins
  const [pluginErrors, setPluginErrors] = createSignal<string[]>([]);
  const [plugins, setPlugins] = createSignal<PluginModule[]>(options?.builtins ?? []);
  const dismissPluginError = (id: number) => {
    setPluginErrors((prev) => prev.filter((_, i) => i !== id));
  };

  const installPlugin = async (script: string) => {
    const loaded = await loadPluginScript(script);

    if (loaded.status === "error") {
      console.error(loaded.error);
      setPluginErrors((prev) => [...prev, loaded.error.message]);
      throw new Error(loaded.error.message);
    }

    for (const plugin of plugins()) {
      if (loaded.plugin.id === plugin.id)
        throw new Error("Plugin with that ID is already installed.");
    }

    setPlugins((prev) => [...prev, loaded.plugin]);
  };

  const uninstallPlugin = (id: string) => {
    const check = plugins().find((p) => p.id === id);
    if (!check) throw new Error("Plugin doesn't exist");

    setPlugins((prev) => [...prev.filter((p) => p.id !== id)]);
  };

  const [devMode, setDevMode] = useDevMode({
    plugins,
    installPlugin,
    uninstallPlugin,
  });

  const components = createMemo(() => {
    const out: Record<
      string,
      PluginComponent & { plugin: { id: string; author: string; label: string } }
    > = {};
    for (const plugin of plugins()) {
      for (const component of plugin.components) {
        const id = `${plugin.id}|${component.id}`;
        out[id] = {
          ...component,
          id,
          plugin: { id: plugin.id, author: plugin.author, label: plugin.label },
        };
      }
    }
    return out;
  });

  // MARK: Sources
  // 0 is top, sources.length is bottom
  const [sources, setSources] = createStore<EditorComponentSource[]>([]);

  // MARK: Saved State
  const [saved, setSaved] = createSignal<true | string>(true);
  const save = async () => {
    if (options?.saver) await options.saver();
    setSaved(true);
  };
  const markDirty = () => {
    setSaved(Math.random().toString());
  };

  // MARK: Serialization
  type SerializedReturnMap = { object: Scene; string: string };
  const serialize = <K extends keyof SerializedReturnMap>(type: K): SerializedReturnMap[K] => {
    const scene: Scene = {
      label: label(),
      plugins: plugins()
        .filter((p) => !p.builtin)
        .map((p) => p.script),
      sources: unwrap(sources),
    };
    if (type === "object") return structuredClone(scene) as SerializedReturnMap[K];
    else return JSON.stringify(scene) as SerializedReturnMap[K];
  };
  const load = async (scene: { label: string; plugins: string[]; sources: ComponentSource[] }) => {
    await reset();
    setLabel(scene.label);
    for (const plugin of scene.plugins) {
      try {
        await installPlugin(plugin);
      } catch (err: any) {
        setPluginErrors((prev) => [...prev, String(err.message)]);
      }
    }
    const editorSources: EditorComponentSource[] = scene.sources.map((s) => ({
      ...s,
      editor: { selected: false },
    }));
    setSources(editorSources);
  };
  const reset = async () => {
    setLabel("Untitled Scene");
    if (options?.builtins) {
      setPlugins(options?.builtins);
    } else {
      setPlugins([]);
    }
    setSources([]);
  };

  // MARK: OBS

  return {
    editorOptions,
    setEditorOptions,
    id,
    setId,
    label,
    setLabel,
    pluginErrors,
    dismissPluginError,
    plugins,
    installPlugin,
    uninstallPlugin,
    components,
    sources,
    setSources,
    devMode,
    setDevMode,
    saved,
    save,
    markDirty,
    serialize,
    load,
    reset,
  };
}
