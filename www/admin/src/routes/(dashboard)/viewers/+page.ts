import { nanoid } from "nanoid";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent }) => {
  const data = await parent();

  const viewerStats = data.pb.breakfast.viewers.count({ requestKey: nanoid() });
  const totalViewerItems = data.pb
    .collection("viewer_items")
    .getList(1, 1, { fields: "id", requestKey: nanoid() })
    .then((d) => d.totalItems);
  const activeCurrencies = data.pb.breakfast.viewers.activeCurrencies({ requestKey: nanoid() });

  return {
    suspense: {
      viewerStats,
      totalViewerItems,
      activeCurrencies,
    },
  };
};
