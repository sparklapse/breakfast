import obsPlugin from "./obs";
import bnbPlugin from "./bread-n-butter";
import type { PluginBuiltin } from "$lib/core";

const BUILT_INS: PluginBuiltin[] = [];

if (import.meta.env.VITE_FEATURE_BUILTINS === "true") {
  // Bread n Butter
  BUILT_INS.push(bnbPlugin);
  // OBS Sources
  BUILT_INS.push(obsPlugin);
}

export { BUILT_INS };
