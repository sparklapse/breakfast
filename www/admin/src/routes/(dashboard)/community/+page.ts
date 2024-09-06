import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent }) => {
  const data = await parent();

  const viewerStats = data.pb.breakfast.viewers.count();
  const activeCurrencies = data.pb.breakfast.viewers.activeCurrencies();

  return {
    suspense: {
      viewerStats,
      activeCurrencies,
    },
  };
};
