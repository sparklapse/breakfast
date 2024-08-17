import { writable, derived, get } from "svelte/store";
import { useViewport } from "./viewport";
import { getContext, onMount, setContext } from "svelte";
import {
  avgPoints,
  getTransformBounds,
  rotatePoint,
  subPoints,
  transformFromAltPoints,
  transformFromPoints,
  transformToPoints,
} from "$lib/math";
import type { Point, Transform } from "$lib/math";
import { radToDeg } from "$lib/math/units";

type Source = {
  id: string;
  tag: string;
  transform: Transform;
  props: Record<string, any>;
  children: Source[];
};

export function createEditor(initial?: { label?: string; sources?: Source[] }) {
  const viewport = useViewport(true);

  const label = writable(initial?.label ?? "");
  const managedSources = writable<{ sources: Source[] }>({ sources: initial?.sources ?? [] });
  const sources = derived(managedSources, ({ sources }) => sources);

  const buildSourceDocument = (fragment: DocumentFragment | Element, source: Source | Source[]) => {
    if (Array.isArray(source)) {
      for (const s of source) {
        buildSourceDocument(fragment, s);
      }
      return fragment;
    }

    const element = document.createElement(source.tag);
    for (const [prop, value] of Object.entries(source.props)) {
      element.setAttribute(prop, value);
    }
    element.id = source.id;
    element.style.position = "absolute";
    element.style.left = `${source.transform.x}px`;
    element.style.top = `${source.transform.y}px`;
    element.style.width = `${source.transform.width}px`;
    element.style.height = `${source.transform.height}px`;
    element.style.transform = `rotate(${source.transform.rotation}deg)`;

    fragment.append(element);

    for (const child of source.children) {
      buildSourceDocument(element, child);
    }

    return fragment;
  };
  const fragment = derived(managedSources, ({ sources }) => {
    const f = new DocumentFragment();
    return buildSourceDocument(f, sources);
  });

  const action = writable<"selecting" | "translating" | "rotating" | "resizing">("selecting");

  const selectedSourceIndices = writable<number[]>([]);
  const selectedSources = derived(
    [selectedSourceIndices, managedSources],
    ([$indices, { sources }]) => $indices.map((i) => sources[i]),
  );
  const selectionBounds = derived(selectedSources, ($selectedSources) =>
    $selectedSources.length > 0
      ? getTransformBounds(...$selectedSources.map((s) => s.transform))
      : undefined,
  );
  const singleSelect = (idx: number) => selectedSourceIndices.set([idx]);
  const addSelect = (idx: number) => selectedSourceIndices.update((prev) => [...prev, idx]);
  const areaSelect = ([start, end]: [Point, Point]) => {
    let indices = [];

    const $sources = get(managedSources).sources;
    const sourceBounds = $sources.map((s) => getTransformBounds(s.transform));
    for (let i = 0; i < $sources.length; i++) {
      const [tl, br] = sourceBounds[i];
      if (tl[0] >= start[0] && tl[1] >= start[1] && br[0] <= end[0] && br[1] <= end[1]) {
        indices.push(i);
      }
    }
    selectedSourceIndices.set(indices);

    return indices.length;
  };
  const deselect = () => selectedSourceIndices.set([]);

  let selectedSnapshot: Source[] = [];

  // #region Translation

  let isTranslating = false;
  let translationStart = { clientX: 0, clientY: 0 };
  const startTranslate = ({ clientX, clientY }: PointerEvent) => {
    selectedSnapshot = structuredClone(get(selectedSources));
    translationStart = { clientX, clientY };
    isTranslating = true;
    action.set("translating");
  };

  onMount(() => {
    const pointermove = (ev: PointerEvent) => {
      if (!isTranslating) return;

      const viewportScale = get(viewport.stores.transform).k;
      const delta = {
        x: (ev.clientX - translationStart.clientX) / viewportScale,
        y: (ev.clientY - translationStart.clientY) / viewportScale,
      };

      managedSources.update(({ sources }) => {
        const indices = get(selectedSourceIndices);
        for (let i = 0; i < indices.length; i++) {
          const idx = indices[i];
          const ref = selectedSnapshot[i];
          sources[idx].transform = {
            ...ref.transform,
            x: Math.round(ref.transform.x + delta.x),
            y: Math.round(ref.transform.y + delta.y),
          };
        }

        return { sources };
      });
    };

    const pointerup = (ev: PointerEvent) => {
      if (!isTranslating) return;
      isTranslating = false;
      action.set("selecting");
    };

    window.addEventListener("pointermove", pointermove);
    window.addEventListener("pointerup", pointerup);

    return () => {
      window.removeEventListener("pointermove", pointermove);
      window.removeEventListener("pointerup", pointerup);
    };
  });

  // #endregion

  // #region Rotation

  let isRotating = false;
  const rotationPivot = writable<Point>([0, 0]);
  const rotationDelta = writable(0);
  const rotationCursorDistance = writable(0);
  const calcDistance = (mouse: { clientX: number; clientY: number }) => {
    const localMouse = viewport.utils.screenToLocal([mouse.clientX, mouse.clientY]);
    const pivot = get(rotationPivot);

    const xDist = localMouse[0] - pivot[0];
    const yDist = localMouse[1] - pivot[1];
    rotationCursorDistance.set(Math.abs(Math.sqrt(xDist * xDist + yDist * yDist)));
  };

  const startRotation = ({ clientX, clientY }: PointerEvent) => {
    const bounds = get(selectionBounds);
    if (!bounds) return;

    selectedSnapshot = structuredClone(get(selectedSources));
    const pivot: Point = avgPoints(...bounds);
    rotationPivot.set(pivot);
    rotationDelta.set(0);
    calcDistance({ clientX, clientY });
    isRotating = true;
    action.set("rotating");
  };

  onMount(() => {
    const pointermove = ({ clientX, clientY, shiftKey }: PointerEvent) => {
      if (!isRotating) return;
      const localMouse = viewport.utils.screenToLocal([clientX, clientY]);
      const pivot = get(rotationPivot);

      let rad =
        Math.atan2(localMouse[1] - pivot[1], localMouse[0] - pivot[0]) + Math.PI / 2; /* 90 deg */

      // if (shiftKey) {
      //   rad = Math.round(rad / (Math.PI / 4)) * (Math.PI / 4);
      // }

      const angle = radToDeg(rad);

      rotationDelta.set(angle);
      calcDistance({ clientX, clientY });

      managedSources.update(({ sources }) => {
        for (const source of selectedSnapshot) {
          const rotated = rotatePoint([source.transform.x, source.transform.y], rad, [
            pivot[0] - source.transform.width / 2,
            pivot[1] - source.transform.height / 2,
          ]);

          const target = sources.findIndex((t) => t.id === source.id);
          sources[target].transform.x = rotated[0];
          sources[target].transform.y = rotated[1];
          sources[target].transform.rotation = source.transform.rotation + angle;
          sources[target].transform.rotation %= 360;

          sources[target].transform = {
            ...sources[target].transform,
          };
        }

        return { sources };
      });
    };

    const pointerup = (ev: PointerEvent) => {
      if (!isRotating) return;
      isRotating = false;
      action.set("selecting");
    };

    window.addEventListener("pointermove", pointermove);
    window.addEventListener("pointerup", pointerup);

    return () => {
      window.removeEventListener("pointermove", pointermove);
      window.removeEventListener("pointerup", pointerup);
    };
  });

  // #endregion

  // #region Resizing

  type ResizeSides = "nw" | "ne" | "sw" | "se";
  let isResizing: ResizeSides | false = false;
  let resizeStart: Point = [0, 0];
  let resizeBounds: [Point, Point];
  const startResizing = ({ clientX, clientY }: PointerEvent, side: ResizeSides) => {
    selectedSnapshot = structuredClone(get(selectedSources));
    resizeBounds = getTransformBounds(...selectedSnapshot.map((s) => s.transform));
    resizeStart = viewport.utils.screenToLocal([clientX, clientY]);
    isResizing = side;
    action.set("resizing");
  };

  onMount(() => {
    const pointermove = ({ clientX, clientY }: PointerEvent) => {
      if (isResizing === false) return;

      const mouseLocal = viewport.utils.screenToLocal([clientX, clientY]);

      managedSources.update(({ sources }) => {
        if (isResizing === false) throw new Error("Bad resize value");

        const indices = get(selectedSourceIndices);
        if (selectedSnapshot.length === 1) {
          const idx = indices[0];
          const ref = selectedSnapshot[0];
          const [tl, br, tr, bl] = transformToPoints(ref.transform);

          if (isResizing === "nw") {
            tl[0] = mouseLocal[0];
            tl[1] = mouseLocal[1];
          }
          if (isResizing === "ne") {
            tr[0] = mouseLocal[0];
            tr[1] = mouseLocal[1];
          }
          if (isResizing === "se") {
            br[0] = mouseLocal[0];
            br[1] = mouseLocal[1];
          }
          if (isResizing === "sw") {
            bl[0] = mouseLocal[0];
            bl[1] = mouseLocal[1];
          }

          if (isResizing === "nw" || isResizing === "se")
            sources[idx].transform = transformFromPoints(tl, br, ref.transform.rotation);
          else sources[idx].transform = transformFromAltPoints(tr, bl, ref.transform.rotation);
        } else {
          const delta = subPoints(mouseLocal, resizeStart);
          const width = resizeBounds[1][0] - resizeBounds[0][0];
          const height = resizeBounds[1][1] - resizeBounds[0][1];

          for (let i = 0; i < indices.length; i++) {
            const idx = indices[i];
            const ref = selectedSnapshot[i];

            let anchor: Point = [0, 0];
            if (isResizing === "nw") {
              anchor = resizeBounds[1];
            }
            if (isResizing === "ne") {
              anchor = [resizeBounds[0][0], resizeBounds[1][1]];
            }
            if (isResizing === "se") {
              anchor = resizeBounds[0];
            }
            if (isResizing === "sw") {
              anchor = [resizeBounds[1][0], resizeBounds[0][1]];
            }

            const scale = Math.max(
              Math.abs(mouseLocal[0] - anchor[0]) / width,
              Math.abs(mouseLocal[1] - anchor[1]) / height,
            );
            const offset = [ref.transform.x - anchor[0], ref.transform.y - anchor[1]];

            sources[idx].transform = {
              ...sources[idx].transform,
              width: ref.transform.width * scale,
              height: ref.transform.height * scale,
              x: anchor[0] + offset[0] * scale,
              y: anchor[1] + offset[1] * scale,
            };
          }
        }

        return { sources };
      });
    };

    const pointerup = (ev: PointerEvent) => {
      if (isResizing === false) return;
      isResizing = false;
      action.set("selecting");
    };

    window.addEventListener("pointermove", pointermove);
    window.addEventListener("pointerup", pointerup);

    return () => {
      window.removeEventListener("pointermove", pointermove);
      window.removeEventListener("pointerup", pointerup);
    };
  });

  // #endregion

  const ctx = {
    sources,
    fragment,
    label,
    selection: {
      action,
      selectedSources,
      selectionBounds,
      singleSelect,
      addSelect,
      areaSelect,
      deselect,
      startTranslate,
      startRotation,
      rotationPivot,
      rotationDelta,
      rotationCursorDistance,
      startResizing,
    },
  };

  setContext("editor", ctx);

  return ctx;
}

export function useEditor(dontCreate?: true) {
  const ctx = getContext<ReturnType<typeof createEditor>>("editor");
  if (dontCreate && !ctx) throw new Error("Failed to get an existing editor context");
  if (!ctx) return createEditor();
  else return ctx;
}
