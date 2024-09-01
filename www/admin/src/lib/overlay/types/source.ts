import { transformType } from "$lib/math";
import { z } from "zod";

const baseSourceType = z.object({
  id: z.string(),
  tag: z.string(),
  transform: transformType,
  props: z.record(z.string()),
  style: z.record(z.string()),
});

const sourceType: z.ZodType<Source> = baseSourceType.extend({
  children: z.lazy(() => sourceType.array()),
});

export type Source = z.infer<typeof baseSourceType> & {
  children: (Source | string)[];
};

export const sourceFieldType = z.object({
  type: z.string(),
  label: z.string().optional(),
  options: z.record(z.any()).optional(),
});

export type SourceField = z.infer<typeof sourceFieldType>;

export const sourceDefType = z.object({
  label: z.string(),
  subLabel: z.string(),
  tag: z.string(),
  fields: sourceFieldType.array(),
});

export type SourceDef = z.infer<typeof sourceDefType>;
