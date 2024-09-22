import { nanoid } from "nanoid";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent, depends }) => {
  const data = await parent();

  depends("db:events");

  const { duration } = await data.pb.breakfast.events.getStoredDuration();
  const types = await data.pb.breakfast.events.getSavedTypes();

  const twitchEventsubList = data.pb
    .collection("twitch_event_subscriptions")
    .getFullList({ requestKey: nanoid() });

  return {
    duration,
    types,
    suspense: {
      twitchEventsubList,
    },
  };
};
