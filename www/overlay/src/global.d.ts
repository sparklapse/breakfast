type BreakfastEvent = {
  type: string;
  initiator: string;
  data: unknown;
};

interface BreakfastGlobal {
  events: {
    /**
     * Listen for events from the breakfast SSE endpoint (chat messages, redeems, etc.)
     * 
     * @param listener Function to call of each event
     * @returns A function to unlisten the provided listener
     */
    listen: (listener: (event: BreakfastEvent) => void | Promise<void>) => Promise<() => void>;
  };
}

declare global {
  var breakfast: BreakfastGlobal;
}

export {};
