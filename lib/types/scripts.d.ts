import type { ComponentType, SvelteComponent } from "svelte";

type Inputs = {
  [key: string]: ComponentType<SvelteComponent<{ options?: Record<string, any> }, any, any>>;
};

type SvelteProps<C extends ComponentType> = NonNullable<ConstructorParameters<C>["0"]["props"]>;

export type TargetRoots = "id" | "tag" | "style" | "transform" | "props" | "children";
export type Target = `${TargetRoots}.${string}` | TargetRoots;

export type SourceInputDefinition<I extends Inputs = Inputs> = {
  [K in keyof I]: {
    type: K;
    defaultValue?: string;
    label?: string;
    options?: SvelteProps<I[K]>["options"];
    target: Target;
    format?: string;
  };
}[keyof I];

export type SourceInputGroup<I extends Inputs = Inputs> = {
  label?: string;
  group: SourceInputDefinition<I>[];
};

export type SourceDefinition<I extends Inputs = Inputs> = {
  label: string;
  subLabel: string;
  tag: string;
  inputs: (SourceInputDefinition<I> | SourceInputGroup<I>)[];
};

export type ActionInputDefinition<I extends Inputs = Inputs> = {
  [K in keyof I]: {
    id: string;
    type: K;
    defaultValue?: string;
    options?: SvelteProps<I[K]>["options"];
  };
}[keyof I];

export type ActionDefinition<I extends Inputs = Inputs> = {
  label: string;
  subLabel: string;
  emit: string;
  inputs?: SourceInputDefinition<I>[];
} & (
  | {
      type: "on-event";
      filter?: string[];
    }
  | {
      type: "trigger";
    }
);

export type OverlayScript<I extends Inputs = Inputs> = {
  id: string;
  label: string;
  version: number;
  script: string;
  sources?: SourceDefinition<I>[];
  actions?: ActionDefinition<I>[];
};
