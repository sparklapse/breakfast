import { nanoid } from "nanoid";
import type { PageLoad } from "./$types";

export const load = (async ({ parent }) => {
  const data = await parent();

  const initial = data.pb
    .collection("events")
    .getList(1, 100, { sort: "-created", requestKey: nanoid() })
    .then((query) => ({
      events: query.items,
      totalPages: query.totalPages,
    }));

  return {
    ...data,
    suspense: {
      initial,
    },
  };
}) satisfies PageLoad;
