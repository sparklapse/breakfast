import { z } from "zod";
import { sourceDefType } from "./source";

export const scriptType = z.object({
  id: z.string(),
  label: z.string(),
  version: z.number(),
  script: z.string(),
  components: sourceDefType.array().optional(),
});

export type Script = z.infer<typeof scriptType>;
