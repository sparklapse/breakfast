import type { InputDefinition, InputDefinitionGroup } from "$lib/io/types.js";

export type TargetRoots = "id" | "tag" | "style" | "transform" | "props" | "children";
export type Target = `${TargetRoots}.${string}` | TargetRoots;

export type SourceInputDefinition = InputDefinition & {
  target: Target;
  defaultValue?: string;
  format?: string;
};

export type SourceDefinition = {
  label: string;
  subLabel: string;
  tag: string;
  inputs: (SourceInputDefinition | InputDefinitionGroup<SourceInputDefinition>)[];
};

export type ActionInputDefinition = InputDefinition;

export type ActionDefinition = {
  label: string;
  subLabel: string;
  emit: string;
  inputs?: SourceInputDefinition[];
} & (
    | {
      type: "on-event";
      filter?: string[];
    }
    | {
      type: "trigger";
    }
  );

export type Script = {
  id: string;
  label: string;
  version: number;
  script: string;
  sources?: SourceDefinition[];
  actions?: ActionDefinition[];
};

