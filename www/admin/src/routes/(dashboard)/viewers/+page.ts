import { nanoid } from "nanoid";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent }) => {
  const data = await parent();

  const viewerStats = data.pb.breakfast.viewers.count({ requestKey: nanoid() });
  const totalViewerItems = Promise.resolve(1234);
  const activeCurrencies = data.pb.breakfast.viewers.activeCurrencies({ requestKey: nanoid() });

  return {
    suspense: {
      viewerStats,
      totalViewerItems,
      activeCurrencies,
    },
  };
};
