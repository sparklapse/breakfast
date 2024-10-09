import { setContext, getContext } from "svelte";
import { OBSWebSocket } from "./ws.js";

export function createOBS() {
    const ctx = setContext("obs", {
        ws: new OBSWebSocket(),
    });
    return ctx;
}

type OBSContext = ReturnType<typeof createOBS>;

export function useOBS(): OBSContext {
    const ctx = getContext<OBSContext>("obs");
    if (!ctx) return createOBS();

    return ctx;
}
