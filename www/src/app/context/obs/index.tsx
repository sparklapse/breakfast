import { createContext, useContext } from "solid-js";
import { createOBSContext } from "./context";
import type { ParentProps } from "solid-js";
import type { OBSContextOptions } from "./context";

type OBSProviderProps = ParentProps & OBSContextOptions;

const Context = createContext<ReturnType<typeof createOBSContext>>();

export function createOBS(options?: OBSContextOptions) {
  const ctx = createOBSContext(options);

  function Provider(props: OBSProviderProps) {
    return <Context.Provider value={ctx}>{props.children}</Context.Provider>;
  }

  return [ctx, Provider] as const;
}

export function useOBS() {
  const ctx = useContext(Context);

  if (!ctx) throw new Error("useOBS must be used within an OBSProvider");
  return ctx;
}
