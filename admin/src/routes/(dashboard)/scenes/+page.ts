import { nanoid } from "nanoid";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent }) => {
  const data = await parent();

  const initial = await data.pb.collection("scenes").getList(1, 10, { requestKey: nanoid() });

  return {
    ...data,
    scenes: {
      initial: initial.items,
      pages: initial.totalPages,
    },
  };
};
