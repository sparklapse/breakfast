/// <reference types="vite/client" />

type stroolean = "true" | "false" | undefined;

interface ImportMetaEnv {
  /**
   * Enable first party scene plugins that are permanently enabled
   */
  readonly VITE_FEATURE_BUILTINS: stroolean;

  /**
   * Are accounts managed externally buy some remote system
   */
  readonly VITE_FEATURE_EXTERNAL_ACCOUNT_MANAGEMENT: stroolean;
  /**
   * Where to go to get authenticated by the remote system
   */
  readonly VTIE_EXTERNAL_ACCOUNT_LOGIN: string | undefined;
  /**
   * Where to go to manage the users account
   */
  readonly VTIE_EXTERNAL_ACCOUNT_MANAGE: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
