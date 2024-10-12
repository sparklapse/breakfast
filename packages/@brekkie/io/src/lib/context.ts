import { setContext, getContext } from "svelte";

export type AssetHelpers = {
  list: (filter: string) => Promise<{ id: string; label: string; url: string }[]>;
  upload: (file: File) => Promise<string>;
  delete?: (id: string) => Promise<void>;
};

export function createAssetHelpers(helpers: AssetHelpers) {
  setContext("io.asset-helpers", helpers);
}

export function useAssetHelpers() {
  const ctx = getContext<AssetHelpers | undefined>("io.asset-helpers");
  return ctx;
}
