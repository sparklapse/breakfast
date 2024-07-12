/// <reference types="vite/client" />

type stroolean = "true" | "false" | undefined;

interface ImportMetaEnv {
  /**
   * Lazy load routes or eagerly load routes
   */
  readonly VITE_FEATURE_LAZY: stroolean;

  /**
   * Enable first party scene plugins that are permanently enabled
   */
  readonly VITE_FEATURE_BUILTINS: stroolean;

  /**
   * Use an external link that will generate auth tokens and handle sign in
   * instead of directly authenticating with pocketbase
   */
  readonly VITE_FEATURE_REMOTE_AUTH: stroolean;
  /**
   * Where to go to get authenticated by the remote system
   */
  readonly VTIE_REMOTE_AUTH_URL: string | undefined;
  /**
   * Where to go to manage the users account
   */
  readonly VTIE_REMOTE_AUTH_MANAGE: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
