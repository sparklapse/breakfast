export type Channel = {
  username: string;
  displayName: string;
};

export type Viewer = {
  id: string;
  username: string;
  displayName: string;
};

export type Platforms = "twitch";

export type ChatMessageEvent = {
  id: string | null;
  type: "chat-message";
  platform: Platforms;
  data: {
    // services/events/types/chat.go
    id: string;
    channel: Channel;
    viewer: Viewer;
    reply: {
      repliedToMessageId: string;
      repliedToViewer: Viewer;
    } | null;
    text: string;
    color: string;
    fragments: {
      type: string;
      text: string;
    }[];
    features: string[];
  };
  deleted?: true;
};

export type ChatMessageDeleteEvent = {
  id: string | null;
  type: "chat-message-delete";
  platform: Platforms;
  data: {
    id: string;
  };
};

export type SubscriptionEvent = {
  type: "subscription";
  platform: Platforms;
  data: {
    channel: Channel;
    viewer: Viewer;
    tier: string;
    gifted: boolean;
  };
};

export type BreakfastEvent = ChatMessageEvent | ChatMessageDeleteEvent | SubscriptionEvent;

interface BreakfastGlobal {
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
