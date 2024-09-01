import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent }) => {
  const data = await parent();

  const viewerCount = data.pb.breakfast.viewers.count();

  return {
    suspense: {
      viewerCount,
    },
  };
};
