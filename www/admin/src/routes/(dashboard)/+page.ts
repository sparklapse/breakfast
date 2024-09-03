import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent, depends }) => {
  const data = await parent();

  depends("db:stats");
  const viewerCount = data.pb.breakfast.viewers.count();

  return {
    suspense: {
      viewerCount,
    },
  };
};
