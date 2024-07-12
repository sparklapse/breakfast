import clsx from "clsx";
import { Show, createSignal, createUniqueId, onCleanup, onMount } from "solid-js";
import { Portal } from "solid-js/web";
import { useViewport } from "../viewport/context";
import type { Accessor, ParentProps } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import type { ComponentSource } from "./types";

type ResizeSides = "nw" | "ne" | "se" | "sw";

type MaybePortalProps = ParentProps & {
  shouldPortal: boolean;
  mount?: Node;
};

function MaybePortal(props: MaybePortalProps) {
  return (
    <Show when={props.shouldPortal} fallback={props.children}>
      <Portal mount={props.mount}>{props.children}</Portal>
    </Show>
  );
}

export function Transformer(props: {
  transform: Accessor<ComponentSource["transform"]>;
  updateTransform: SetStoreFunction<ComponentSource["transform"]>;
  selected: Accessor<boolean>;
  updateSelected: (selected: boolean) => void;
  remove: () => void;
  options?: {
    minSourceSize: number;
  };
}) {
  const minSourceSize = props.options?.minSourceSize ?? 20;
  const { transform: vpTransform, screenToLocal } = useViewport();

  const id = createUniqueId();
  // const [selected, setSelected] = createSignal(false);
  const [dragging, setDragging] = createSignal(false);
  const [rotating, setRotating] = createSignal(false);
  const [resizing, setResizing] = createSignal<false | ResizeSides>(false);

  let clientRef = { clientX: 0, clientY: 0 };
  let transformRef = { x: 0, y: 0, width: 0, height: 0 };

  const reset = () => {
    clientRef = { clientX: 0, clientY: 0 };
    transformRef = { x: 0, y: 0, width: 0, height: 0 };
  };

  const setReference = (ev: PointerEvent) => {
    const { clientX, clientY } = ev;
    clientRef = { clientX, clientY };
    transformRef = { ...props.transform() };

    props.updateSelected(true);
  };

  const startMove = (ev: PointerEvent) => {
    setReference(ev);

    setDragging(true);
  };

  const startRotate = (ev: PointerEvent) => {
    setReference(ev);

    setRotating(true);
  };

  const startResize = (side: ResizeSides) => (ev: PointerEvent) => {
    setReference(ev);

    setResizing(side);
  };

  const move = (ev: PointerEvent) => {
    if (!dragging()) return;
    if (rotating()) {
      setDragging(false);
      return;
    }
    if (resizing() !== false) {
      setDragging(false);
      return;
    }

    const scale = vpTransform().k;

    props.updateTransform(
      "x",
      Math.round(transformRef.x + (ev.clientX - clientRef.clientX) / scale),
    );
    props.updateTransform(
      "y",
      Math.round(transformRef.y + (ev.clientY - clientRef.clientY) / scale),
    );
  };

  const rotate = (ev: PointerEvent) => {
    if (!rotating()) return;

    const mouseLocal = screenToLocal({ x: ev.clientX, y: ev.clientY });
    const radians = Math.atan2(
      mouseLocal.y - (transformRef.y + transformRef.height / 2),
      mouseLocal.x - (transformRef.x + transformRef.width / 2),
    );
    const angle = radians * (180 / Math.PI) + 90;

    props.updateTransform("angle", angle % 360);
  };

  const resize = (ev: PointerEvent) => {
    const side = resizing();
    if (!side) return;

    const scale = vpTransform().k;

    let resized = structuredClone(transformRef);

    if (side.startsWith("s")) {
      resized.height = Math.round(
        Math.max(minSourceSize, transformRef.height + (ev.clientY - clientRef.clientY) / scale),
      );
    } /* startsWith("n") */ else {
      resized.height = Math.round(
        Math.max(minSourceSize, transformRef.height - (ev.clientY - clientRef.clientY) / scale),
      );
      resized.y = Math.round(
        Math.min(
          transformRef.y + transformRef.height - minSourceSize,
          transformRef.y + (ev.clientY - clientRef.clientY) / scale,
        ),
      );
    }
    if (side.endsWith("e")) {
      resized.width = Math.round(
        Math.max(minSourceSize, transformRef.width + (ev.clientX - clientRef.clientX) / scale),
      );
    } /* endsWith("w") */ else {
      resized.x = Math.round(
        Math.min(
          transformRef.x + transformRef.width - minSourceSize,
          transformRef.x + (ev.clientX - clientRef.clientX) / scale,
        ),
      );
      resized.width = Math.round(
        Math.max(minSourceSize, transformRef.width - (ev.clientX - clientRef.clientX) / scale),
      );
    }

    props.updateTransform(resized);
  };

  const end = () => {
    setDragging(false);
    setRotating(false);
    setResizing(false);

    reset();
  };

  const start = (ev: PointerEvent) => {
    if (!(dragging() || rotating() || resizing())) {
      const target = ev.target as Element | null;
      if (
        target?.closest(`[data-component-source-transformer=${id}]`) === null &&
        target?.closest("[data-component-source-editor]") === null &&
        target?.closest("[data-no-source-deselect]") === null
      )
        props.updateSelected(false);
    }
  };

  const shortcuts = (ev: KeyboardEvent) => {
    if ((ev.target as Element | null)?.closest("[data-component-source-editor]") !== null) return;
    if (props.selected() && (ev.key === "Delete" || ev.key === "Backspace")) props.remove();
  };

  onMount(() => {
    window.addEventListener("pointerdown", start);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointermove", rotate);
    window.addEventListener("pointermove", resize);
    window.addEventListener("pointerup", end);
    window.addEventListener("keydown", shortcuts);

    onCleanup(() => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointermove", rotate);
      window.removeEventListener("pointermove", resize);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("keydown", shortcuts);
    });
  });

  return (
    <MaybePortal
      mount={document.querySelector("[data-breakfast-viewport]")!}
      shouldPortal={props.selected()}
    >
      <div
        class={clsx(
          "esc-pan absolute select-none rounded-[1px] border-2 border-dashed border-black transition-[shadow,opacity]",
          props.selected() || dragging() || rotating() || resizing()
            ? "opacity-100 shadow"
            : "opacity-0 hover:opacity-100 hover:shadow",
        )}
        style={{
          ...(props.selected()
            ? {
                width: `${props.transform().width}px`,
                height: `${props.transform().height}px`,
                left: `${props.transform().x}px`,
                top: `${props.transform().y}px`,
                rotate: `${props.transform().angle}deg`,
              }
            : {
                inset: 0,
              }),
          "z-index": props.selected() ? 9999 : "inherit",
        }}
        onpointerdown={startMove}
        data-component-source-transformer={id}
      >
        {/* Rotation Handle */}
        <div
          class="absolute -top-14 left-1/2 min-h-4 min-w-4 -translate-x-1/2 cursor-alias rounded-full bg-black/50"
          style={{
            width: `${14 / vpTransform().k}px`,
            height: `${14 / vpTransform().k}px`,
          }}
          onpointerdown={(ev) => {
            startRotate(ev);
          }}
        />
        {/* Resize Handles */}
        <div>
          <div
            class="esc-pan absolute left-0 top-0 m-0.5 min-h-4 min-w-4 cursor-nw-resize bg-black/50"
            style={{
              width: `${14 / vpTransform().k}px`,
              height: `${14 / vpTransform().k}px`,
            }}
            onpointerdown={startResize("nw")}
          />
          <div
            class="esc-pan absolute right-0 top-0 m-0.5 min-h-4 min-w-4 cursor-ne-resize bg-black/50"
            style={{
              width: `${14 / vpTransform().k}px`,
              height: `${14 / vpTransform().k}px`,
            }}
            onpointerdown={startResize("ne")}
          />
          <div
            class="esc-pan absolute bottom-0 left-0 m-0.5 min-h-4 min-w-4 cursor-sw-resize bg-black/50"
            style={{
              width: `${14 / vpTransform().k}px`,
              height: `${14 / vpTransform().k}px`,
            }}
            onpointerdown={startResize("sw")}
          />
          <div
            class="esc-pan absolute bottom-0 right-0 m-0.5 min-h-4 min-w-4 cursor-se-resize bg-black/50"
            style={{
              width: `${14 / vpTransform().k}px`,
              height: `${14 / vpTransform().k}px`,
            }}
            onpointerdown={startResize("se")}
          />
        </div>
      </div>
    </MaybePortal>
  );
}
