import { z } from "zod";
import { transformType } from "$lib/overlay/math/transform.js";

const baseSourceType = z.object({
  id: z.string(),
  tag: z.string(),
  transform: transformType,
  props: z.record(z.string()),
  style: z.record(z.string()),
});

export const sourceType: z.ZodType<Source> = baseSourceType.extend({
  children: z.lazy(() => sourceType.or(z.string()).array()),
});

export type Source = z.infer<typeof baseSourceType> & {
  children: (Source | string)[];
};
