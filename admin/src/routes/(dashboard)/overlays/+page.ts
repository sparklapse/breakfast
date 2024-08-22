import { nanoid } from "nanoid";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent }) => {
  const data = await parent();

  const initial = data.pb
    .collection("overlays")
    .getList(1, 10, { sort: "-updated", requestKey: nanoid() })
    .then((query) => ({
      overlays: query.items,
      totalPages: query.totalPages,
    }));

  return {
    ...data,
    suspense: {
      initial,
    },
  };
};
