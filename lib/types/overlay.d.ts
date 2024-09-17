import type { Action } from "./actions";

export type Channel = {
  username: string;
  displayName: string;
};

export type Viewer = {
  id: string;
  displayName: string;
  wallet: Record<string, number>;
};

export type Chatter = {
  username: string;
  displayName: string;
};

export type Platforms = "twitch" | "actions";

export type ActionEvent = {
  id: string | null;
  type: "action";
  platform: Platforms;
  data: Action;
};

export type ChatMessageEvent = {
  id: string | null;
  type: "chat-message";
  platform: Platforms;
  data: {
    // services/events/types/chat.go
    id: string;
    channel: Channel;
    chatter: Chatter;
    viewer: Viewer | null;
    reply: {
      repliedToMessageId: string;
      repliedToChatter: Chatter;
      repliedToViewer: Viewer | null;
    } | null;
    text: string;
    color: string;
    fragments: {
      type: string;
      text: string;
    }[];
    features: string[];
  };
  /**
   * This field is only used on the client side to flag a message deleted by a delete event
   */
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
    chatter: Chatter;
    viewer: Viewer | null;
    tier: string;
    gifted: boolean;
  };
};

export type BreakfastEvent =
  | ActionEvent
  | ChatMessageEvent
  | ChatMessageDeleteEvent
  | SubscriptionEvent;

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
