import { z } from "zod";
import { INPUT_EDITORS } from "./inputs/index.js";
import type { ComponentType } from "svelte";
import type { ZodType } from "zod";

export type SvelteProps<C extends ComponentType> = NonNullable<ConstructorParameters<C>["0"]["props"]>;

export type InputDefinition = {
  [K in keyof typeof INPUT_EDITORS]: {
    id: string;
    type: K;
    label?: string;
    options?: SvelteProps<(typeof INPUT_EDITORS)[K]>["options"];
  };
}[keyof typeof INPUT_EDITORS];

export const inputDefinitionType = z.object({
  id: z.string(),
  type: z.string() as ZodType<InputDefinition["type"]>,
  label: z.string().optional(),
  options: z.record(z.any()).optional(),
}) satisfies ZodType<InputDefinition>;

export type InputDefinitionGroup<Input extends InputDefinition = InputDefinition> = {
  group: Input[]
};

export type InputListDefinition<Input extends InputDefinition = InputDefinition> = {
  id: string;
  label?: string;
  list: Input | Input[];
};

