import { nanoid } from "nanoid";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent }) => {
  const data = await parent();

  const initial = data.pb
    .collection("scenes")
    .getList(1, 10, { requestKey: nanoid() })
    .then((query) => ({
      scenes: query.items,
      totalPages: query.totalPages,
    }));

  return {
    ...data,
    suspense: {
      initial,
    },
  };
};
