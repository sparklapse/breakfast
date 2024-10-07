type LocalConfig = {
  twitchChannels: string[];
};
const url = new URL(window.location.href);
const twitchChannels = url.searchParams.get("twitchChannels")?.split(",") ?? [];

export const config: LocalConfig = {
  twitchChannels,
};
