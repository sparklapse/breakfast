import { nanoid } from "nanoid";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent }) => {
  const data = await parent();

  const initial = data.pb
    .collection("assets")
    .getList(1, 100, { sort: "-created", requestKey: nanoid() })
    .then((query) => ({
      assets: query.items,
      totalPages: query.totalPages,
    }));

  return {
    ...data,
    suspense: {
      initial,
    },
  };
};
