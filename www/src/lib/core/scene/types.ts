import { z } from "zod";
import { componentSourceType } from "../component";

export const sceneType = z.object({
  id: z.string().optional(),
  label: z.string(),
  plugins: z.string().array(),
  sources: componentSourceType.array(),
  created: z.coerce.date().optional(),
  updated: z.coerce.date().optional(),
});

export type Scene = z.infer<typeof sceneType>;
