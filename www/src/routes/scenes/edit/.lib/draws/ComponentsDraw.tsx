import { For, Show, createMemo, createSignal } from "solid-js";
import { produce } from "solid-js/store";
import { Shapes } from "lucide-solid";
import { useViewport } from "$lib/core/viewport/context";
import { useEditor } from "$app/context/editor";
import Fuse from "fuse.js";

const idToColor = (id: string) => {
  let total = 0;
  for (const char of id) {
    total += 4;
    total ^= char.charCodeAt(0);
  }
  return total % 360;
};

export function ComponentsDraw() {
  const { components, setSources } = useEditor();
  const { screenToLocal } = useViewport();
  const [search, setSearch] = createSignal("");

  const fuse = createMemo(() => {
    return new Fuse(Object.values(components()), {
      keys: ["label", "plugin.label", "plugin.author"],
    });
  });

  const results = createMemo(() => {
    return search()
      ? fuse().search(search())
      : Object.values(components()).map((c) => ({ item: c }));
  });

  return (
    <div class="flex flex-col gap-2">
      <h2 class="flex items-center gap-2 text-3xl">
        <Shapes size="2rem" /> Components
      </h2>
      <h3 class="font-semibold">Add component</h3>
      <input
        class="w-full rounded border px-2 py-1"
        type="text"
        placeholder="Search for a component to add"
        value={search()}
        oninput={(ev) => setSearch(ev.currentTarget.value)}
      />
      <div class="flex flex-wrap gap-2">
        <Show when={search()}>
          <h4 class="w-full text-sm opacity-75">Search Results</h4>
        </Show>
        <For each={results()}>
          {({ item }, index) => (
            <>
              <Show when={!search() && results()[index() - 1]?.item.plugin.id !== item.plugin.id}>
                <h4 class="w-full text-sm opacity-75">{item.plugin.label}</h4>
              </Show>
              <button
                id={item.id}
                class="flex min-w-28 flex-col items-center gap-0.5 rounded border-2 border-[hsl(var(--color),100%,30%)] bg-[hsl(var(--color),100%,95%)] px-2 py-1 shadow"
                style={{
                  "--color": item.color ?? idToColor(item.id),
                }}
                onclick={() => {
                  const width = 300;
                  const height = 400;
                  let { x, y } = screenToLocal({
                    x: (window.innerWidth / 4) * 3,
                    y: window.innerHeight / 2,
                  });

                  x -= width / 2;
                  y -= height / 2;

                  x = Math.round(x);
                  y = Math.round(y);

                  setSources(
                    produce((prev) => {
                      prev.unshift({
                        label: "Untitled " + item.label,
                        component: item.id,
                        data: {},
                        editor: { selected: true },
                        transform: { x, y, width, height, angle: 0 },
                      });
                    }),
                  );
                }}
              >
                <span>{item.label}</span>
                <span class="text-xs text-zinc-500">{item.plugin.label}</span>
              </button>
            </>
          )}
        </For>
      </div>
    </div>
  );
}
