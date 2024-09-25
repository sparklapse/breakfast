import type { BreakfastEvent } from "./event.js";

export type Action = {
  type: string;
  emit: string;
  inputs: Record<string, any>;
  event: BreakfastEvent | null;
};
