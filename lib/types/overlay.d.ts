export type User = {
  id: string;
  username: string;
  displayName: string;
};

export type ChatEvent = {
  type: "chat-message";
  initiator: string;
  data: {
    // services/events/types/chat.go
    id: string;
    channel: User;
    chatter: User;
    reply: {
      repliedToMessageId: string;
      repliedToChatter: User;
    } | null;
    text: string;
    color: string;
    fragments: {
      type: string;
      text: string;
    }[];
    features: string[];
    platform: string;
  };
};

export type BreakfastEvent = ChatEvent & {
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
    listen: (
      listener: (event: BreakfastEvent) => void | Promise<void>
    ) => Promise<() => Promise<void>>;
  };
}

declare global {
  var breakfast: BreakfastGlobal;
}
