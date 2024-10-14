import type { Action } from "./action.js";

export type Channel = {
  username: string;
  displayName: string;
};

export type Viewer = {
  id: string;
  displayName: string;
  wallet: Record<string, number> | null;
  providers?: string;
  providerIds?: string;
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
      images: { url: string }[];
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
  id: string | null;
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

export type CurrencySpentEvent = {
  id: string | null;
  type: "currency-spent",
  platform: Platforms;
  data: {
    id: string;
    channel: Channel;
    chatter: Chatter;
    viewer: Viewer | null;
    input: string;
    redeemed: {
      id: string;
      label: string;
      description: string;
      currency: string;
      cost: number;
    };
    item: unknown | null;
    status: "unfulfilled" | "fulfilled" | "cancelled" | (string & {});
  };
};

export type BreakfastEvent =
  | ActionEvent
  | ChatMessageEvent
  | ChatMessageDeleteEvent
  | SubscriptionEvent
  | CurrencySpentEvent;
