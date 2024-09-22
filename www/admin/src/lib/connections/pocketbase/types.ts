import { z } from "zod";

export const overlayType = z.object({
  id: z.string().optional(),
  label: z.string(),
  plugins: z.string().array(),
  sources: z.string(),
  created: z.coerce.date().optional(),
  updated: z.coerce.date().optional(),
});

export type Overlay = z.infer<typeof overlayType>;
