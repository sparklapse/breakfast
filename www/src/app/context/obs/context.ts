import { createSignal } from "solid-js";
import { OBSWebSocket, sync } from "$lib/obs";
import type { ComponentSource } from "$lib/core";
import type { SyncOptions, Result } from "$lib/obs";

export type OBSContextOptions = {
  password?: string;
};

type BaseSource = {
  label: string;
};

export type BreakfastSource = BaseSource & {
  breakfast: true;
  kind: "browser_source";
  settings: {
    url: string;
  };
  indicies: number[];
};

export type OBSSource = BaseSource & {
  breakfast: false;
  kind: string;
  settings: any;
  transform: ComponentSource["transform"];
};

export type Source = BreakfastSource | OBSSource;

export function createOBSContext(options?: OBSContextOptions) {
  const [port, $setPort] = createSignal(parseInt(localStorage.getItem("obs.port") ?? "") || 4455);
  const [password, $setPassword] = createSignal(options?.password ?? localStorage.getItem("obs.password") ?? "");
  const [connected, setConnected] = createSignal(false);
  const [autoSync, setAutoSync] = createSignal(false);
  const [previews, setPreviews] = createSignal(false);

  const setPort = (v: number) => {
    localStorage.setItem("obs.port", JSON.stringify(v));
    $setPort(v);
  };

  const setPassword = (v: string) => {
    localStorage.setItem("obs.password", v);
    $setPassword(v);
  };

  const ws = new OBSWebSocket();

  ws.addEventListener("connect", () => {
    setConnected(true);
  });

  ws.addEventListener("disconnect", () => {
    setConnected(false);
  });

  const connect = async (): Promise<Result<{ message: string } | undefined>> => {
    if (connected()) return { status: "success" as const, data: { message: "Already connected" } };

    const result = await ws.connect(port(), password());
    return result;
  };

  const disconnect = () => {
    setAutoSync(false);
    ws.disconnect();
  };

  const request = ws.request.bind(ws);

  const syncScene = (options: Omit<SyncOptions, "ws">) => sync({ ...options, ws });

  return {
    port,
    setPort,
    password,
    setPassword,
    connected,
    connect,
    autoSync,
    setAutoSync,
    previews,
    setPreviews,
    disconnect,
    request,
    syncScene,
  };
}
