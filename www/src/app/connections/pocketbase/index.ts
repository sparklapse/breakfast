import PocketBase, { BaseAuthStore, getTokenPayload, isTokenExpired } from "pocketbase";
import { customAlphabet } from "nanoid";
import { createRoot, createSignal, type Accessor } from "solid-js";
import { sceneType } from "$lib/core";

export const streamKeyAlphabet = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 21);

type UserModel = {
  id: string;
  streamKey: string;
} | null;

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
  };

  authStore: SolidAuthStore;

  constructor(...args: ConstructorParameters<typeof PocketBase>) {
    super(...args);
    this.authStore = new SolidAuthStore();

    const url = new URL(window.location.toString());
    const existingUserAuth =
      url.searchParams.get("token") ?? window.localStorage.getItem("pb-users-token");
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
        window.localStorage.removeItem("pb-users-token");
        window.localStorage.removeItem("pb-viewers-token");
      }
      if (!model) return;
      window.localStorage.setItem(`pb-${model.collectionName}-token`, token);
    });
  }
}

export const pb = new Breakfast();
pb.beforeSend = async (url, options) => {
  options.credentials = "include";

  return { url, options };
};

pb.realtime.subscribe(
  "breakfast/events",
  (data) => {
    console.log(data);
  },
  // {
  //   query: {
  //     sk: "abc123",
  //   },
  // },
);
