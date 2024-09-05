import type { BreakfastEvent } from "./overlay";

export type Action = {
  type: string;
  emit: string;
  inputs: Record<string, any>;
  event: BreakfastEvent | null;
};
