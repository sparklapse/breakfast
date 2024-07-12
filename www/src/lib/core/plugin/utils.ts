import { parse } from "acorn";
import { pluginModuleType, pluginType } from "./types";
import type { Plugin, PluginModule } from "./types";

type LoadedPlugin =
  | {
      status: "success";
      plugin: PluginModule;
    }
  | {
      status: "error";
      error: { message: string } & any;
      plugin?: PluginModule;
    };

export async function loadPluginScript(script: string): Promise<LoadedPlugin> {
  const blob = new Blob([script], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  let parsed: Awaited<ReturnType<typeof pluginModuleType.safeParseAsync>>;
  try {
    const module = await import(/* @vite-ignore */ url);
    URL.revokeObjectURL(url);
    parsed = await pluginModuleType.safeParseAsync({ ...module, script });
  } catch (err: any) {
    return {
      status: "error",
      error: {
        message:
          "Script failed to load: " + (typeof err.message === "string" ? err.message : "unknown"),
        extra: err,
      },
    };
  }

  if (!parsed.success)
    return {
      status: "error",
      error: parsed.error,
    };

  return {
    status: "success",
    plugin: parsed.data,
  };
}

type ScriptMeta =
  | {
      status: "success";
      plugin: Plugin;
    }
  | {
      status: "error";
      error: any;
    };

const META_KEYS = ["id", "label", "version", "author"];
export function safelyGetScriptMeta(script: string): ScriptMeta {
  const result = parse(script, { ecmaVersion: "latest", sourceType: "module" });
  const maybeAsset: Partial<Plugin> = { script };

  for (const token of result.body) {
    if (token.type !== "VariableDeclaration") continue;
    for (const declaration of token.declarations) {
      if (declaration.id.type !== "Identifier") continue;
      if (declaration.init?.type !== "Literal") continue;

      if (!META_KEYS.includes(declaration.id.name)) continue;
      if (typeof declaration.init.value !== "string") continue;

      maybeAsset[declaration.id.name as keyof Omit<Plugin, "builtin">] = declaration.init.value;
    }
  }

  const parsed = pluginType.safeParse(maybeAsset);
  if (!parsed.success)
    return {
      status: "error",
      error: parsed.data,
    };

  return {
    status: "success",
    plugin: parsed.data,
  };
}
