import toast from "solid-toast";
import { PluginDevWebSocket } from "$app/connections/plugin-dev";
import { safelyGetScriptMeta } from "$lib/core/plugin/utils";
import { createEffect, createSignal, onCleanup } from "solid-js";
import type { PluginModule } from "$lib/core";
import type { Accessor } from "solid-js";

type UseDevModeOptions = {
  plugins: Accessor<PluginModule[]>;
  installPlugin: (script: string) => Promise<void>;
  uninstallPlugin: (script: string) => void;
};

export function useDevMode(options: UseDevModeOptions) {
  let devWs: PluginDevWebSocket | undefined;
  const [devMode, setDevMode] = createSignal(false);

  const connectDevWs = () => {
    devWs = new PluginDevWebSocket("ws://localhost:7654");

    devWs.addEventListener("error", () => {
      devWs?.shutdown();
      setTimeout(() => {
        connectDevWs();
      }, 300);
    });

    devWs.addEventListener("message", (ev) => {
      const meta = safelyGetScriptMeta(ev.data);
      if (meta.status === "error") {
        toast.error("Invalid script delivered by dev server");
        return;
      }

      if (options.plugins().find((p) => p.id === meta.plugin.id))
        options.uninstallPlugin(meta.plugin.id);

      toast.promise(options.installPlugin(ev.data as string), {
        loading: "Updating dev plugin...",
        success: "Dev plugin updated!",
        error: (err) => `Failed to install dev plugin: ${err.message}`,
      });
    });
  };

  createEffect(() => {
    if (devMode()) {
      if (devWs) devWs.shutdown();
      connectDevWs();
    } else {
      devWs?.shutdown();
    }
  });

  onCleanup(() => {
    devWs?.shutdown();
  });

  return [devMode, setDevMode] as const;
}
