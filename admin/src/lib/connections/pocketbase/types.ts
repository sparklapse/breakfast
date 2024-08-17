import { z } from "zod";

export const sourceType = z.object({});

export const sceneType = z.object({
  id: z.string().optional(),
  label: z.string(),
  plugins: z.string().array(),
  sources: sourceType.array(),
  created: z.coerce.date().optional(),
  updated: z.coerce.date().optional(),
});

export type Scene = z.infer<typeof sceneType>;
