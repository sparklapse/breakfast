import { BreakfastPocketBase } from "$lib/connections/pocketbase";
import { redirect } from "@sveltejs/kit";
import type { LayoutLoad } from "./$types";

export const ssr = false;

export const load: LayoutLoad = async ({ route, fetch }) => {
  const pb = new BreakfastPocketBase(fetch);

  if (!pb.authStore.isAuthenticated()) {
    const isSetup = await pb.breakfast.setup.isSetup();
    if (!isSetup && route.id !== "/setup") redirect(302, "/breakfast/setup");
    if (route.id !== "/sign-in") redirect(302, "/breakfast/sign-in");
  }

  const user = pb.authStore.modelStore;

  return {
    pb,
    user,
  };
};
