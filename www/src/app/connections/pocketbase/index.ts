import PocketBase, {
  BaseAuthStore,
  getTokenPayload,
  isTokenExpired,
  RealtimeService,
} from "pocketbase";
import { customAlphabet } from "nanoid";
import { createRoot, createSignal, type Accessor } from "solid-js";
import { sceneType } from "$lib/core";
import { TWITCH_AUTH_SCOPES } from "./auth";

export const streamKeyAlphabet = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 21);

/**
 * Open a url in a popup window
 *
 * Implementation copied from the pocketbase js-sdk
 * https://github.com/pocketbase/js-sdk/blob/eb6092d82ae0b82061c559eda1d5323368370ba4/src/services/RecordService.ts#L1100
 *
 * @param url url to open in popup window
 * @returns the window opened
 */
function openBrowserPopup(url?: string | URL): Window | null {
  let width = 1024;
  let height = 768;

  let windowWidth = window.innerWidth;
  let windowHeight = window.innerHeight;

  // normalize window size
  width = width > windowWidth ? windowWidth : width;
  height = height > windowHeight ? windowHeight : height;

  let left = windowWidth / 2 - width / 2;
  let top = windowHeight / 2 - height / 2;

  // note: we don't use the noopener and noreferrer attributes since
  // for some reason browser blocks such windows then url is undefined/blank
  return window.open(
    url,
    "popup_window",
    "width=" +
      width +
      ",height=" +
      height +
      ",top=" +
      top +
      ",left=" +
      left +
      ",resizable,menubar=no",
  );
}

type UserModel = {
  id: string;
  streamKey: string;
} | null;

/**
 * An auth store that has solid signals instead of just plain js properties.
 */
class SolidAuthStore extends BaseAuthStore {
  tokenStore: Accessor<string>;
  modelStore: Accessor<UserModel | null>;
  isValidStore: Accessor<boolean>;

  cleanup: () => void;

  constructor() {
    super();

    const [token, model, isValid, unlisten] = createRoot(() => {
      const [token, setToken] = createSignal<string>("");
      const [model, setModel] = createSignal<UserModel>(null);
      const isValid = () => {
        if (token().length === 0) return false;
        try {
          const payload = getTokenPayload(token());
          if (!payload.exp) return false;
        } catch {
          return false;
        }
        try {
          if (isTokenExpired(token())) return false;
        } catch {
          return false;
        }
        return true;
      };

      const unlisten = this.onChange((token, model) => {
        setToken(token);
        setModel(model as UserModel);
      });

      return [token, model, isValid, unlisten];
    });

    this.tokenStore = token;
    this.modelStore = model;
    this.isValidStore = isValid;
    this.cleanup = () => {
      unlisten();
    };
  }
}

/**
 * Extended PocketBase client with extra Breakfast APIs
 */
class Breakfast extends PocketBase {
  breakfast = {
    setup: {
      isSetup: async () => {
        const result = await this.send("/api/breakfast/setup", {});
        if (typeof result === "boolean") return result as boolean;
        return true;
      },
      runSetup: async (setup: { username: string; password: string }) => {
        await this.send("/api/breakfast/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(setup),
        });
      },
    },
    scenes: {
      resetStreamKey: async () => {
        const userId = this.authStore.modelStore()?.id;
        if (!userId) throw new Error("Not authenticated");
        const newKey = await this.send("/api/breakfast/account/reset-sk", { method: "POST" });
        if (!newKey.sk) {
          throw new Error("Failed to reset stream key");
        }
        this.collection("users").authRefresh();
      },
      getSceneWithStreamKey: async (id: string, sk: string) => {
        const scene = await this.collection("scenes").getOne(id, { query: { sk } });

        const parsed = sceneType.safeParse(scene);
        if (!parsed.success) throw new Error("API returned invalid scene");

        return parsed.data;
      },
    },
    auth: {
      sso: {
        twitch: async () => {
          let resolve: () => void;
          let reject: (reason: string) => void;
          const promise = new Promise<void>((res, rej) => {
            resolve = res;
            reject = rej;
          });

          const methods = await this.collection("users").listAuthMethods();
          const provider = methods.authProviders.find((p) => p.name === "twitch");
          if (!provider) throw new Error("Twitch provider not enabled");

          const url = new URL(provider.authUrl);
          const redirectUri = import.meta.env.VITE_FEATURE_PROXY_AUTH_REDIRECT
            ? "https://auth.brekkie.stream/callback"
            : this.buildUrl("/api/oauth2-redirect");

          const realtime = new RealtimeService(this);
          await realtime.subscribe(
            "@oauth2",
            async (data: { state: string; code: string }) => {
              await this.collection("users").authWithOAuth2Code(
                provider.name,
                data.code,
                provider.codeVerifier,
                redirectUri,
              );
              resolve();
            },
          );

          url.searchParams.set("state", realtime.clientId);
          if (import.meta.env.VITE_FEATURE_PROXY_AUTH_REDIRECT) {
            const state = url.searchParams.get("state");
            url.searchParams.set("state", `${state}|${window.location.host}`);
          }
          url.searchParams.set("scope", TWITCH_AUTH_SCOPES.join(" "));
          url.searchParams.set("redirect_uri", redirectUri);

          openBrowserPopup(url);

          const cleanup = () => {
            realtime.unsubscribe();
          };

          const timeout = setTimeout(() => {
            reject("Request timed out");
            cleanup();
          }, 30000);

          await promise;
          clearTimeout(timeout);
          cleanup();
        },
      },
    },
  };

  authStore: SolidAuthStore;

  constructor(...args: ConstructorParameters<typeof PocketBase>) {
    super(...args);
    this.authStore = new SolidAuthStore();

    const url = new URL(window.location.toString());
    const existingUserAuth =
      url.searchParams.get("token") ?? window.localStorage.getItem("pb_users_auth");
    if (existingUserAuth) {
      this.authStore.save(existingUserAuth);
      this.collection("users")
        .authRefresh()
        .then(() => {
          if (url.searchParams.get("token")) window.history.replaceState(null, "", "/breakfast");
        })
        .catch((err) => {
          console.error("Failed to auth with stored token:", err);
          this.authStore.clear();
        });
    }

    this.authStore.onChange((token, model) => {
      if (token === "") {
        window.localStorage.removeItem("pb_users_auth");
        window.localStorage.removeItem("pb_viewers_auth");
      }
      if (!model) return;
      window.localStorage.setItem(`pb_${model.collectionName}_auth`, token);
    });
  }
}

export const pb = new Breakfast();
pb.beforeSend = async (url, options) => {
  options.credentials = "include";

  return { url, options };
};
