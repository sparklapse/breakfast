import { BreakfastPocketBase } from "$lib/connections/pocketbase";
import { redirect } from "@sveltejs/kit";
import type { LayoutLoad } from "./$types";
import { OBSWebSocket } from "$lib/connections/obs";

export const ssr = false;

export const load: LayoutLoad = async ({ route, fetch }) => {
  const pb = new BreakfastPocketBase(fetch);
  const obs = new OBSWebSocket();

  const isSetup = await pb.breakfast.setup.isSetup();
  if (!isSetup && route.id !== "/setup") redirect(302, "/breakfast/setup");

  /**
   * OBS Easy Connect
   *
   * Connects to OBS using stored password and config if any. Otherwise does nothing.
   * @returns
   */
  const obsEC = async () => {
    const obsPassword = localStorage.getItem("obs.password");
    if (obsPassword !== null) {
      const obsPort = Number.isNaN(parseInt(localStorage.getItem("obs.port") ?? "Nan"))
        ? obs.port
        : parseInt(localStorage.getItem("obs.port")!);
      const obsAddress =
        localStorage.getItem("obs.address") === null
          ? obs.address
          : localStorage.getItem("obs.address")!;

      return await obs.connect(obsPassword, obsPort, obsAddress);
    }
  };
  obsEC();

  const url = new URL(window.location.toString());
  const existingUserAuth =
    url.searchParams.get("token") ?? window.localStorage.getItem("pb_users_auth");
  if (existingUserAuth) {
    pb.authStore.save(existingUserAuth);
    await pb
      .collection("users")
      .authRefresh()
      .then(() => {
        if (url.searchParams.get("token")) window.history.replaceState(null, "", url.pathname);
      })
      .catch((err) => {
        console.error("Failed to auth with stored token:", err);
        pb.authStore.clear();
      });
  }

  if (!pb.authStore.isAuthenticated() && route.id?.startsWith("/(authenticated)")) {
    if (route.id !== "/sign-in") redirect(302, "/breakfast/sign-in");
  }

  const user = pb.authStore.modelStore;

  return {
    pb,
    user,
    obs,
    obsEC,
  };
};
