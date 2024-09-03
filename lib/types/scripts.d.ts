import type { ComponentType, SvelteComponent } from "svelte";

declare global {
  namespace Breakfast {
    interface Overlay {
      Fields: {
        [key: string]: ComponentType<SvelteComponent<{ options?: Record<string, any> }, any, any>>;
      };
    }
  }
}

type SvelteProps<C extends ComponentType> = NonNullable<ConstructorParameters<C>["0"]["props"]>;

export type TargetRoots = "id" | "style" | "transform" | "props";

export type SourceFieldDefinition = {
  [K in keyof Breakfast.Overlay["Fields"]]: {
    type: K;
    label?: string;
    options?: SvelteProps<Breakfast.Overlay["Fields"][K]>["options"];
    target: `${TargetRoots}.${string}`;
    format?: string;
  };
}[keyof Breakfast.Overlay["Fields"]];

export type SourceFieldGroup = {
  label?: string;
  group: SourceFieldDefinition[];
};

export type SourceDefinition = {
  label: string;
  subLabel: string;
  tag: string;
  fields: (SourceFieldDefinition | SourceFieldGroup)[];
};

export type OverlayScript = {
  id: string;
  label: string;
  version: number;
  script: string;
  sources?: SourceDefinition[];
};
