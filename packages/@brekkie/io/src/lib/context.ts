import { setContext, getContext } from "svelte";

export type AssetHelpers = {
    getAssets: (filter: string) => Promise<any[]>,
    uploadAsset: (file: File) => Promise<string>,
};

export function createAssetHelpers(helpers: AssetHelpers) {
    setContext("io.asset-helpers", helpers);
}

export function useAssetHelpers() {
    const ctx = getContext<AssetHelpers | undefined>("io.asset-helpers");
    return ctx;
}
