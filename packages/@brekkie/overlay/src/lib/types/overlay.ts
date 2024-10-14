import type { Script } from "./script.js";

export type Overlay = {
  id: string;
  label: string;
  scripts: Script[];
  sources: string;
  logic: unknown | null;
  visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
  meta: Record<string, any>;
};
