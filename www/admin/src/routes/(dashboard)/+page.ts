import { nanoid } from "nanoid";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent, depends }) => {
  const data = await parent();

  depends("db:stats");
  const viewerCount = data.pb.breakfast.viewers.count({ requestKey: nanoid() });
  const totalItems = data.pb
    .collection("items")
    .getList(1, 1, { fields: "id", requestKey: nanoid() })
    .then((d) => d.totalItems);

  return {
    suspense: {
      viewerCount,
      totalItems,
    },
  };
};
