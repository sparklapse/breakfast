import { nanoid } from "nanoid";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent }) => {
  const data = await parent();

  const totalSavedEvents = data.pb
    .collection("events")
    .getList(1, 1, { fields: "id", requestKey: nanoid() })
    .then((d) => d.totalItems);

  return {
    suspense: {
      totalSavedEvents,
    },
  };
};
