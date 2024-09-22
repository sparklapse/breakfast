import { basics } from "./basics";
import type { OverlayScript } from "@sparklapse/breakfast/scripts";
import type { SOURCE_INPUTS } from "../sources/inputs";

export const DEFAULT_SCRIPTS: OverlayScript<typeof SOURCE_INPUTS>[] = [basics];
