import { z } from "zod";

export const pointType = z.tuple([z.number(), z.number()]);
export type Point = z.infer<typeof pointType>;

export const transformType = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number(),
});
export type Transform = z.infer<typeof transformType>;
