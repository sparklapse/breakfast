import type { ComponentSource } from "$lib/core";
import type { InputKindSettings, InputKinds } from "../types/input-kinds";

type BaseSource = {
  label: string;
};

export type BreakfastSource = BaseSource & {
  breakfast: true;
  kind: InputKinds<"browser">;
  settings: { url: string } & Partial<Omit<InputKindSettings<"browser">, "url">>;
  indices: number[];
};

export type OBSSource = BaseSource & {
  breakfast: false;
  kind: string;
  settings: any;
  transform: ComponentSource["transform"];
};

export type Source = BreakfastSource | OBSSource;
