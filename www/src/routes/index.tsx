import { Layers3, Settings, Home } from "lucide-solid";
import StitchGridLayout from "$app/components/layouts/StitchGrid";
import { pb } from "$app/connections/pocketbase";
import { Match, Switch } from "solid-js";
import toast from "solid-toast";

export default function HomePage() {
  return (
    <>
      <Switch>
        <Match when={pb.authStore.isValidStore()}>
          <StitchGridLayout
            header={<h1 class="font-semibold">Breakfast</h1>}
            links={[
              {
                href: "/scenes",
                label: "Scenes",
                icon: Layers3,
              },
              ...(import.meta.env.VITE_FEATURE_SAAS === "true"
                ? [{ href: import.meta.env.VITE_SAAS_URL, label: "Home", icon: Home }]
                : []),
              {
                href: "/settings",
                label: "Settings",
                icon: Settings,
              },
            ]}
          />
        </Match>
        <Match when={!pb.authStore.isValidStore()}>
          <div class="grid h-screen w-screen place-content-center">
            {import.meta.env.VITE_FEATURE_REMOTE_AUTH === "true" ? (
              <a href={import.meta.env.VTIE_REMOTE_AUTH_URL}>Login</a>
            ) : (
              <form
                class="flex flex-col gap-2"
                onsubmit={(ev) => {
                  ev.preventDefault();
                  const data = new FormData(ev.currentTarget);

                  toast.promise(
                    pb
                      .collection("users")
                      .authWithPassword(
                        data.get("username") as string,
                        data.get("password") as string,
                      ),
                    {
                      loading: "Signing in...",
                      success: "Signed in successfully!",
                      error: (err) => `Failed to sign in: ${err.message}`,
                    },
                  );
                }}
              >
                <p>Login</p>
                <input class="rounded px-2" type="text" name="username" placeholder="Username" />
                <input
                  class="rounded px-2"
                  type="password"
                  name="password"
                  placeholder="Password"
                />
                <button type="submit">Sign In</button>
              </form>
            )}
          </div>
        </Match>
      </Switch>
    </>
  );
}
