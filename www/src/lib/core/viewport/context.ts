import { createContext, useContext } from "solid-js";
import type { Accessor } from "solid-js";
import type { Transform } from "$lib/core";
import type { ViewportTransform } from "./types";

export const Context = createContext<{
  transform: Accessor<ViewportTransform>;
  setTransformOverTime: ({ x, y, k }: ViewportTransform, duration: number) => Promise<void>;
  panTo: (
    transform: Omit<Transform, "angle"> & { padding?: number },
    duration?: number,
  ) => Promise<void>;
  screenToLocal: (position: { x: number, y: number}) => { x: number, y: number };
}>();

export type ViewportContext = NonNullable<typeof Context.defaultValue>;

export function useViewport() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useViewport must be used within a child of a viewport");
  return ctx;
}
