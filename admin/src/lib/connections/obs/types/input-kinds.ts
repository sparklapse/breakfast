export type Kinds = {
  browser: {
    kind: "browser_source";
    settings: {
      css: string;
      fps: number;
      fps_custom: boolean;
      height: number;
      reroute_audio: boolean;
      restart_when_active: boolean;
      shutdown: boolean;
      url: string;
      webpage_control_level: number;
      width: number;
    };
  };
  unknown: {
    kind: string;
    settings: unknown;
  };
};

export type InputKinds<K extends keyof Kinds = keyof Kinds> = Kinds[K]["kind"];
export type InputKindSettings<K extends keyof Kinds = keyof Kinds> = Kinds[K]["settings"];
