import { z } from "zod";

export const scriptType = z.object({
  filename: z.string(),
  script: z.string(),
  builtin: z.boolean().optional(),
});

export type Script = z.infer<typeof scriptType>;
