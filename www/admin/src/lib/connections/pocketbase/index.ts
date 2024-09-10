import { writable } from "svelte/store";
import PocketBase, {
  BaseAuthStore,
  getTokenPayload,
  isTokenExpired,
  RealtimeService,
  type SendOptions,
} from "pocketbase";
import { customAlphabet } from "nanoid";
import { TWITCH_AUTH_SCOPES } from "./auth";
import { PUBLIC_FEATURE_PROXY_AUTH_REDIRECT } from "$env/static/public";
import type { Readable } from "svelte/store";
import type { Action } from "@sparklapse/breakfast/actions";
import type { Viewer } from "@sparklapse/breakfast/db";

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
  username: string;
};

/**
 * An auth store that has svelte stores instead of just plain js properties.
 */
class SvelteAuthStore extends BaseAuthStore {
  tokenStore: Readable<string>;
  modelStore: Readable<UserModel | null>;

  constructor() {
    super();
    const token = writable("", (set) => {
      set(this.token);
      const unlisten = this.onChange((token) => {
        set(token);
      });

      return () => {
        unlisten();
      };
    });
    this.tokenStore = {
      subscribe: token.subscribe,
    };

    const model = writable<UserModel | null>(null, (set) => {
      set(this.model as UserModel);
      const unlisten = this.onChange((_, model) => {
        set(model as UserModel);
      });

      return () => {
        unlisten();
      };
    });
    this.modelStore = {
      subscribe: model.subscribe,
    };
  }

  isAuthenticated() {
    if (this.token.length === 0) return false;
    try {
      const payload = getTokenPayload(this.token);
      if (!payload.exp) return false;
    } catch {
      return false;
    }
    try {
      if (isTokenExpired(this.token)) return false;
    } catch {
      return false;
    }
    return true;
  }
}

/**
 * Extended PocketBase client with extra Breakfast APIs
 */
export class BreakfastPocketBase extends PocketBase {
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
    resetStreamKey: async () => {
      const userId = this.authStore.model?.id;
      if (!userId) throw new Error("Not authenticated");
      const newKey = await this.send("/api/breakfast/account/reset-sk", { method: "POST" });
      if (!newKey.sk) {
        throw new Error("Failed to reset stream key");
      }
      this.collection("users").authRefresh();
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
          const redirectUri = PUBLIC_FEATURE_PROXY_AUTH_REDIRECT
            ? "https://auth.brekkie.stream/callback"
            : this.buildUrl("/api/oauth2-redirect");

          const realtime = new RealtimeService(this);
          await realtime.subscribe("@oauth2", async (data: { state: string; code: string }) => {
            await this.collection("users").authWithOAuth2Code(
              provider.name,
              data.code,
              provider.codeVerifier,
              redirectUri,
            );
            resolve();
          });

          url.searchParams.set("state", realtime.clientId);
          if (PUBLIC_FEATURE_PROXY_AUTH_REDIRECT) {
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
    overlays: {
      action: async (action: Action) => {
        await this.send("/api/breakfast/overlays/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action),
        });
      },
    },
    events: {
      purge: async (category: "old" | "all" = "old") => {
        await this.send(`/api/breakfast/events/purge-${category}`, {});
      },
      getStoredDuration: async (): Promise<{ duration: string }> => {
        return await this.send("/api/breakfast/events/settings/stored-duration", {});
      },
      setStoredDuration: async (duration: string) => {
        await this.send("/api/breakfast/events/settings/stored-duration", {
          method: "POST",
          body: JSON.stringify({ duration }),
        });
      },
      getSavedTypes: async (): Promise<{ saved: string[]; available: string[] }> => {
        return await this.send("/api/breakfast/events/settings/saved-types", {});
      },
      setSavedTypes: async (types: string[]) => {
        await this.send("/api/breakfast/events/settings/saved-types", {
          method: "POST",
          body: JSON.stringify({ types }),
        });
      },
      twitch: {
        listPools: async (): Promise<{
          [key: string]: { status: string; subscriptions: number };
        }> => {
          return await this.send("/api/breakfast/events/twitch/eventsub/pools", {});
        },
        resubscribeDefaults: async () => {
          await this.send("/api/breakfast/events/twitch/eventsub/resubscribe-defaults", {
            method: "POST",
          });
        },
        createSubscription: async (subscription: {
          type: string;
          data: { broadcasterLogin: string };
        }) => {
          await this.send("/api/breakfast/events/twitch/eventsub/subscribe", {
            method: "POST",
            body: JSON.stringify(subscription),
          });
        },
        deleteSubscription: async (id: string) => {
          await this.send(`/api/breakfast/events/twitch/eventsub/unsubscribe/${id}`, {
            method: "POST",
          });
        },
      },
    },
    viewers: {
      list: async (
        page: number = 1,
        perPage: number = 20,
        search: string = "",
        options?: SendOptions,
      ): Promise<
        {
          id: string;
          displayName: string;
          providers: string;
          providerIds: string;
        }[]
      > => {
        return await this.send("/api/breakfast/viewers", {
          ...options,
          query: {
            ...options?.query,
            page,
            perPage,
            ...(search === "" ? {} : { search }),
          },
        });
      },
      getById: async (id: string, options?: SendOptions): Promise<Viewer> => {
        return await this.send(`/api/breakfast/viewers/${id}`, options ?? {});
      },
      getByProviderUsername: async (
        provider: string,
        username: string,
        options?: SendOptions,
      ): Promise<Viewer> => {
        return await this.send(
          `/api/breakfast/viewers/by-provider/${provider}/${username}`,
          options ?? {},
        );
      },
      count: async (options?: SendOptions): Promise<{ total: number; new30: number }> => {
        return await this.send("/api/breakfast/viewers/count", options ?? {});
      },
      activeCurrencies: async (options?: SendOptions): Promise<{ currencies: string[] }> => {
        return await this.send("/api/breakfast/viewers/currencies", options ?? {});
      },
      getProfileItems: async (
        viewerId: string,
        options?: SendOptions,
      ): Promise<{ base: string; accessories: string[] }> => {
        return await this.send(`/api/breakfast/viewers/${viewerId}/profile-items`, options ?? {});
      },
    },
  };

  authStore: SvelteAuthStore;

  constructor(f: typeof fetch, ...args: ConstructorParameters<typeof PocketBase>) {
    super(...args);
    this.beforeSend = (url, options) => {
      options = { fetch: f, ...options };
      return { url, options };
    };
    this.authStore = new SvelteAuthStore();

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
