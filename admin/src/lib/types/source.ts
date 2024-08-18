import { transformType } from "$lib/math";
import { z } from "zod";

const baseSourceType = z.object({
  id: z.string(),
  tag: z.string(),
  transform: transformType,
  props: z.record(z.string()),
});

type BaseSource = z.infer<typeof baseSourceType> & {
  children: BaseSource[];
};

const sourceType: z.ZodType<BaseSource> = baseSourceType.extend({
  children: z.lazy(() => sourceType.array()),
});

export type Source = z.infer<typeof sourceType>;
