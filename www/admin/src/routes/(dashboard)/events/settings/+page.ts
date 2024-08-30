import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent }) => {
  const data = await parent();

  const { duration } = await data.pb.breakfast.events.getStoredDuration();
  const types = await data.pb.breakfast.events.getSavedTypes();

  return {
    duration,
    types,
  };
};
