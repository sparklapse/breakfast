import clsx from "clsx";
import toast from "solid-toast";
import { For, Show } from "solid-js";
import { produce } from "solid-js/store";
import { ArrowDown, ArrowUp, Image, Trash2 } from "lucide-solid";
import { useViewport } from "$lib/core/viewport/context";
import { useEditor } from "$app/context/editor";

export function SceneDraw() {
  const { components, sources, setSources, markDirty } = useEditor();
  const { panTo } = useViewport();

  const hasComponent = (id: string) => {
    return Boolean(components()[id]);
  };
  const renameSource = (idx: number, value: string) => {
    if (idx < 0 || idx >= sources.length) {
      toast.error("Tried to rename a source that's out of bounds");
      return;
    }

    setSources(idx, "label", value);
    markDirty();
  };
  const deleteSource = (idx: number) => {
    setSources(
      produce((prev) => {
        prev.splice(idx, 1);
      }),
    );
    markDirty();
  };
  const moveSourceUp = (idx: number) => {
    setSources(
      produce((prev) => {
        const [moved] = prev.splice(idx, 1);
        prev.splice(Math.max(0, idx - 1), 0, moved);
      }),
    );
    markDirty();
  };
  const moveSourceDown = (idx: number) => {
    setSources(
      produce((prev) => {
        const max = prev.length - 1;
        const [moved] = prev.splice(idx, 1);
        prev.splice(Math.min(max, idx + 1), 0, moved);
      }),
    );
    markDirty();
  };

  return (
    <div class="flex flex-col gap-2">
      <h2 class="flex items-center gap-2 text-3xl">
        <Image size="2rem" /> Scene
      </h2>
      <h3 class="font-bold">Sources</h3>
      <ul class="flex flex-col">
        <Show when={sources.length === 0}>
          <p class="text-zinc-500">No sources! Head the the sources tab to start adding some...</p>
        </Show>
        <For each={sources}>
          {(item, index) => (
            <li
              class={clsx([
                "flex items-center justify-between gap-2 px-2 py-1",
                !hasComponent(item.component) && "bg-red-200 text-red-950",
              ])}
            >
              <input
                type="text"
                class="w-full border-b-2 border-transparent bg-transparent outline-none transition-colors duration-75 focus:border-zinc-600"
                value={item.label}
                placeholder="Untitled Source"
                oninput={(ev) => renameSource(index(), ev.currentTarget.value)}
                onfocus={() => {
                  const { x, y, width, height } = item.transform;
                  panTo({ x: x + width / 2, y: y + height / 2, width, height, padding: 400 }, 150);
                  setSources(
                    produce((prev) => {
                      prev.find((_, i) => i === index())!.editor.selected = true;
                    }),
                  );
                }}
              />
              <span class="flex items-center gap-1">
                <button
                  onclick={() => moveSourceUp(index())}
                  class={clsx(["aspect-square", index() === 0 && "pointer-events-none opacity-50"])}
                >
                  <ArrowUp size="1.25rem" />
                </button>
                <button
                  onclick={() => moveSourceDown(index())}
                  class={clsx([
                    "aspect-square",
                    index() === sources.length - 1 && "pointer-events-none opacity-50",
                  ])}
                >
                  <ArrowDown size="1.25rem" />
                </button>
                <button onclick={() => deleteSource(index())} class="aspect-square">
                  <Trash2 size="1.25rem" />
                </button>
              </span>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}
