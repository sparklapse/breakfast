export type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

export type Viewer = {
  id: string;
  displayName: string;
  wallet: Record<string, number> | null;
  providers?: string;
  providerIds?: string;
};

export type ItemType =
  | "BADGE"
  | "COLLECTABLE"
  | "CONSUMABLE"
  | "PROFILE_BASE"
  | "PROFILE_ACCESSORY";

export type Item = {
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
