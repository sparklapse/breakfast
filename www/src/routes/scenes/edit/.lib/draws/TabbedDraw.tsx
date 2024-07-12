import clsx from "clsx";
import { For, Show, createSignal } from "solid-js";
import type { JSX } from "solid-js";

export type TabbedDrawProps = {
  tabs: { label: string; icon: JSX.Element; content: JSX.Element }[];
};

export function TabbedDraw(props: TabbedDrawProps) {
  const [open, setOpen] = createSignal<false | number>(false);

  return (
    <>
      <Show when={open() !== false}>
        <div
          class="esc-pan esc-zoom absolute inset-0 z-10"
          onpointerdown={() => setOpen(false)}
          data-no-source-deselect
        />
      </Show>
      <div
        class={clsx([
          "esc-pan esc-zoom absolute inset-y-0 left-0 z-10 grid h-screen w-full max-w-[28rem] grid-cols-[1fr,2rem] drop-shadow transition-transform",
          open() !== false ? "" : "-translate-x-[calc(100%-2rem)]",
        ])}
      >
        <div class="bg-white p-2">
          <Show when={open() !== false}>{props.tabs[open() as number].content}</Show>
        </div>
        <div data-no-source-deselect>
          <For each={props.tabs}>
            {(item, index) => (
              <button
                class={clsx([
                  "flex w-8 items-center gap-2 rounded-r bg-white px-1 py-2 transition-opacity duration-75",
                  open() !== false && (open() === index() ? "" : "opacity-70"),
                ])}
                style={{ "writing-mode": "vertical-rl", "text-orientation": "sideways" }}
                onclick={() =>
                  setOpen((prev) => {
                    if (prev === index()) return false;
                    return index();
                  })
                }
              >
                {item.icon}
                {item.label}
              </button>
            )}
          </For>
        </div>
      </div>
    </>
  );
}
