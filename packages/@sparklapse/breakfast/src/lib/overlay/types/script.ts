import { z } from "zod";
import { ZodType } from "zod";
import { inputDefinitionType } from "$lib/io/types.js";
import type { InputDefinition, InputDefinitionGroup } from "$lib/io/types.js";

export type TargetRoots = "id" | "tag" | "style" | "transform" | "props" | "children";
export type Target = `${TargetRoots}.${string}` | TargetRoots | (string & {});

export type SourceInputDefinition = InputDefinition & {
  target: Target;
  defaultValue?: string;
  format?: string;
};

export const sourceInputDefinitionType = inputDefinitionType.extend({
  target: z.string(),
  defaultValue: z.string().optional(),
  format: z.string().optional(),
}) satisfies ZodType<SourceInputDefinition>;

export type SourceDefinition = {
  label: string;
  subLabel: string;
  tag: string;
  inputs: (SourceInputDefinition | InputDefinitionGroup<SourceInputDefinition>)[];
};

export const sourceDefinitionType = z.object({
  label: z.string(),
  subLabel: z.string(),
  tag: z.string(),
  inputs: sourceInputDefinitionType
    .or(z.object({ group: sourceInputDefinitionType.array() }))
    .array(),
}) satisfies ZodType<SourceDefinition>;

export type ActionInputDefinition = InputDefinition;

export const actionInputDefinitionType = inputDefinitionType;

export type ActionDefinition = {
  label: string;
  subLabel: string;
  emit: string;
  inputs?: ActionInputDefinition[];
} & (
  | {
      type: "on-event";
      filter?: string[];
    }
  | {
      type: "trigger";
    }
);

const actionDefinitionBaseType = z.object({
  label: z.string(),
  subLabel: z.string(),
  emit: z.string(),
  inputs: actionInputDefinitionType.array().optional(),
});

export const actionDefinitionType = z.union([
  actionDefinitionBaseType.extend({
    type: z.literal("on-event"),
    filter: z.string().array().optional(),
  }),
  actionDefinitionBaseType.extend({
    type: z.literal("trigger"),
  }),
]) satisfies ZodType<ActionDefinition>;

export type Script = {
  id: string;
  label: string;
  version: number;
  script: string;
  sources?: SourceDefinition[];
  actions?: ActionDefinition[];
};

export const scriptType = z.object({
  id: z.string(),
  label: z.string(),
  version: z.number(),
  script: z.string(),
  sources: sourceDefinitionType.array().optional(),
  actions: actionDefinitionType.array().optional(),
}) satisfies ZodType<Script>;
