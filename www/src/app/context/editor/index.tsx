import { createContext, useContext } from "solid-js";
import { createEditorContext } from "./context";
import type { ParentProps } from "solid-js";
import type { EditorContextOptions } from "./context";

type EditorProviderProps = ParentProps & EditorContextOptions;

const Context = createContext<ReturnType<typeof createEditorContext>>();

export function createEditor(options?: EditorContextOptions) {
  const ctx = createEditorContext(options);

  function Provider(props: EditorProviderProps) {
    return <Context.Provider value={ctx}>{props.children}</Context.Provider>;
  }

  return [ctx, Provider] as const;
}

export function useEditor() {
  const ctx = useContext(Context);

  if (!ctx) throw new Error("useEditor must be used within an EditorProvider");
  return ctx;
}
