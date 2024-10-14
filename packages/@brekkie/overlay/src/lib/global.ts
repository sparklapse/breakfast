import type { BreakfastEvent } from "$lib/types/event.js";

interface BreakfastGlobal {
  viewers: {
    addCurrency: (id: string, amount: number, currency?: string) => Promise<void>;
  };
  events: {
    /**
     * Listen for events from the breakfast SSE endpoint (chat messages, redeems, etc.)
     *
     * @param listener Function to call of each event
     * @returns A function to unlisten the provided listener
     */
    listen: (
      listener: (event: BreakfastEvent) => void | Promise<void>,
    ) => Promise<() => Promise<void>>;
  };
}

declare global {
  var breakfast: BreakfastGlobal;
}

export default {};
