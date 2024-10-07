import { z } from "zod";
import type { ZodType } from "zod";
import type { InputDefinition } from "$lib/io/types.js";
import { scriptType, type Script } from "$lib/overlay/index.js";

export type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

export type Viewer = {
  id: string;
  displayName: string;
  wallet: Record<string, number> | null;
  providers?: string;
  providerIds?: string;
};

export type Overlay = {
  id: string;
  label: string;
  owner: string;
  sources: string;
  scripts: Script[] | null;
  logic: {} | null;
  meta: Record<string, any> | null;
  created: string;
  updated: string;
};

export const overlayType = z.object({
  id: z.string(),
  label: z.string(),
  owner: z.string(),
  sources: z.string(),
  scripts: scriptType.array().nullable(),
  logic: z.object({}).nullable(),
  meta: z.record(z.any()).nullable(),
  created: z.string().datetime(),
  updated: z.string().datetime(),
}) satisfies ZodType<Overlay>;

export type Page = {
  id: string;
  path: string;
  html: string;
  schema: InputDefinition[] | null;
  data: { lang: string;[key: string]: any }[] | null;
};

export type ItemType =
  | "BADGE"
  | "COLLECTABLE"
  | "CONSUMABLE"
  | "PROFILE_BASE"
  | "PROFILE_ACCESSORY"
  | (string & {});

export type Item = {
  id: string;
  type: ItemType;
  label: string;
  description: string | null;
  image: string | File | null;
  action: unknown | null;
  shopPurchasable: boolean;
  shopInfo: {
    prices:
    | {
      [key: string]: number;
    }
    | "free";
  } | null;
  meta: any | null;
  visibility: Visibility;
};
