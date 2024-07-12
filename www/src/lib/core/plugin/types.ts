import { z } from "zod";
import type { JSX } from "solid-js";
import type { ComponentProps, ComponentEditorProps } from "$lib/core";

export const pluginType = z.object({
  id: z.string(),
  label: z.string(),
  version: z.string(),
  author: z.string(),
  script: z.string(),
  builtin: z.boolean().optional(),
});

export type Plugin = z.infer<typeof pluginType>;

export const pluginComponentType = z.object({
  id: z.string(),
  label: z.string(),
  color: z.coerce.number().optional(),
  component: z.function(z.tuple([z.custom<ComponentProps>()]), z.custom<JSX.Element>()),
  editor: z
    .function(z.tuple([z.custom<ComponentEditorProps>()]), z.custom<JSX.Element>())
    .optional(),
});

export type PluginComponent = z.infer<typeof pluginComponentType>;

export const pluginModuleType = pluginType.extend({
  components: pluginComponentType.array().default([]),
});

export type PluginModule = z.infer<typeof pluginModuleType>;

export type PluginBuiltin = Omit<z.infer<typeof pluginModuleType>, "script" | "builtin"> & {
  builtin: true;
  script: "";
};
