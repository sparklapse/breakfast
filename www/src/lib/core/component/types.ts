import { z } from "zod";
import type { SetStoreFunction } from "solid-js/store";

export const transformType = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  angle: z.number(),
});

export type Transform = z.infer<typeof transformType>;

export const componentSourceType = z.object({
  label: z.string(),
  component: z.string(),
  data: z.record(z.any()),
  transform: transformType,
});

export type ComponentSource = z.infer<typeof componentSourceType>;

export type ComponentProps<T extends Record<string, any> = Record<string, any>> = {
  transform: Transform;
  data: Partial<T>;
};

export type ComponentEditorProps<T extends Record<string, any> = Record<string, any>> = {
  data: Partial<T>;
  setData: SetStoreFunction<T>;
};
