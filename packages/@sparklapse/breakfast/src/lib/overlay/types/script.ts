import type { ComponentType } from "svelte";
import type { INPUT_EDITORS } from "$lib/io/inputs/index.js";

type SvelteProps<C extends ComponentType> = NonNullable<ConstructorParameters<C>["0"]["props"]>;

export type TargetRoots = "id" | "tag" | "style" | "transform" | "props" | "children";
export type Target = `${TargetRoots}.${string}` | TargetRoots;

export type SourceInputDefinition = {
  [K in keyof typeof INPUT_EDITORS]: {
    type: K;
    defaultValue?: string;
    label?: string;
    options?: SvelteProps<(typeof INPUT_EDITORS)[K]>["options"];
    target: Target;
    format?: string;
  };
}[keyof typeof INPUT_EDITORS];

export type SourceInputGroup = {
  label?: string;
  group: SourceInputDefinition[];
};

export type SourceDefinition = {
  label: string;
  subLabel: string;
  tag: string;
  inputs: (SourceInputDefinition | SourceInputGroup)[];
};

export type ActionInputDefinition = {
  [K in keyof typeof INPUT_EDITORS]: {
    id: string;
    type: K;
    defaultValue?: string;
    options?: SvelteProps<(typeof INPUT_EDITORS)[K]>["options"];
  };
}[keyof typeof INPUT_EDITORS];

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
