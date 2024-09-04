import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent }) => {
  const data = await parent();

  const viewerStats = data.pb.breakfast.viewers.count();

  return {
    suspense: {
      viewerStats,
    },
  };
};
