import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";
import type { ExternalAuthModel } from "pocketbase";
import { nanoid } from "nanoid";

export const load: PageLoad = async ({ parent, depends }) => {
  const data = await parent();
  if (!data.pb.authStore.model) redirect(302, "/breakfast/sign-in");

  depends("pb:account");
  const identities = data.pb
    .collection("users")
    .listExternalAuths(data.pb.authStore.model!.id)
    .then((i) =>
      i.reduce(
        (acc, prev) => ({ ...acc, [prev.provider]: prev }),
        {} as Record<string, ExternalAuthModel>,
      ),
    );

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
      identities,
      twitchEventsubList,
    },
  };
};
