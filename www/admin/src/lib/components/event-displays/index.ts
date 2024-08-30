import ChatMessage from "./ChatMessage.svelte";
import type { ComponentType } from "svelte";

export const DISPLAYS: Record<string, ComponentType> = {
  "chat-message": ChatMessage,
};
