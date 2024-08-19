import { transformType } from "$lib/math";
import { z } from "zod";

const baseSourceType = z.object({
  id: z.string(),
  tag: z.string(),
  transform: transformType,
  props: z.record(z.string()),
});

export type Source = z.infer<typeof baseSourceType> & {
  children: (Source | string)[];
};

const sourceType: z.ZodType<Source> = baseSourceType.extend({
  children: z.lazy(() => sourceType.array()),
});
