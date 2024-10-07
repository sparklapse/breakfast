import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent }) => {
  const data = await parent();
  if (data.obs.connected) redirect(302, "/breakfast/obs");

  return {
    ...data,
  };
};
