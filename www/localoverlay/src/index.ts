import "@fontsource-variable/gabarito";
import "@sparklapse/breakfast/overlay/global";
import "./style.css";

import { ChatClient } from "@twurple/chat";
import { config } from "./config";

import type { BreakfastEvent, ChatMessageEvent } from "@sparklapse/breakfast/overlay";

class BreakfastEvents extends EventTarget {
  emitChatMessageEvent(message: ChatMessageEvent) {
    this.dispatchEvent(new CustomEvent("@breakfast/events", { detail: message }));
  }
}

const events = new BreakfastEvents();

const client = new ChatClient({
  channels: config.twitchChannels,
  rejoinChannelsOnReconnect: true
});
if (config.twitchChannels.length > 0) client.connect();
client.onMessage((channel, username, message, data) => {
  events.emitChatMessageEvent({
    id: null,
    type: "chat-message",
    data: {
      id: data.id,
      color: data.userInfo.color ?? "black",
      text: message,
      viewer: null,
      features: [],
      fragments: [
        {
          type: "text",
          text: message,
          images: [],
        },
      ],
      reply: data.isReply ? {
        repliedToMessageId: data.parentMessageId ?? "unknown",
        repliedToChatter: {
          username: data.parentMessageUserName ?? "unknown",
          displayName: data.parentMessageUserDisplayName ?? "unknown",
        },
        repliedToViewer: null,
      } : null,
      channel: {
        username: channel,
        displayName: channel,
      },
      chatter: {
        username,
        displayName: data.userInfo.displayName,
      },
    },
    platform: "twitch",
  })
});

window.breakfast = {
  events: {
    listen: async (listener) => {
      const handler = (ev: CustomEvent<BreakfastEvent>) => {
        listener(ev.detail);
      };
      events.addEventListener("@breakfast/events", handler as EventListener);
      return async () => {
        events.removeEventListener("@breakfast/events", handler as EventListener);
      };
    },
  },
};
