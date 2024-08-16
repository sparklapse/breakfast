import { writable, derived, get } from "svelte/store";
import { useViewport } from "./viewport";
import { onMount } from "svelte";
import { getBounds, rotatePoint, transformToPoints } from "$lib/math";
import type { Point, Transform } from "$lib/math";

type Source = {
  id: string;
  tag: string;
  transform: Transform;
  props: Record<string, any>;
  children: Source[];
};

export function createEditor(initialSources?: Source[]) {
  const viewport = useViewport(true);

  const managedSources = writable<{ sources: Source[] }>({ sources: initialSources ?? [] });

  const sources = derived(managedSources, ({ sources }) => sources);

  const fragment = new DocumentFragment();
  const buildSourceDocument = (fragment: DocumentFragment | Element, source: Source) => {
    const element = document.createElement(source.tag);
    for (const [prop, value] of Object.entries(source.props)) {
      element.setAttribute(prop, value);
    }
    element.id = source.id;
    element.style.position = "absolute";
    element.style.left = `${source.transform.x}px`;
    element.style.top = `${source.transform.y}px`;
    element.style.width = `${source.transform.width}px`;
    element.style.height = `${source.transform.width}px`;
    element.style.transform = `rotate(${source.transform.rotation}deg)`;

    fragment.append(element);

    for (const child of source.children) {
      buildSourceDocument(element, child);
    }

    return fragment;
  };

  const selectedSourceIndices = writable<number[]>([]);
  const selectedSources = derived(
    [selectedSourceIndices, managedSources],
    ([$indices, { sources }]) => $indices.map((i) => sources[i]),
  );
  const selectionBounds = derived(selectedSources, ($selectedSources) =>
    $selectedSources.length > 0
      ? getBounds(...$selectedSources.map((s) => s.transform))
      : undefined,
  );
  const singleSelect = (idx: number) => selectedSourceIndices.set([idx]);
  const addSelect = (idx: number) => selectedSourceIndices.update((prev) => [...prev, idx]);
  const areaSelect = ({ start, end }: { start: Point; end: Point }) => {
    let indices = [];

    const $sources = get(managedSources).sources;
    const sourceBounds = $sources.map((s) => getBounds(s.transform));
    for (let i = 0; i < $sources.length; i++) {
      if (
        sourceBounds[i].x > start.x &&
        sourceBounds[i].y > start.y &&
        sourceBounds[i].x + sourceBounds[i].width < end.x &&
        sourceBounds[i].y + sourceBounds[i].width < end.y
      ) {
        indices.push(i);
      }
    }
    selectedSourceIndices.set(indices);
  };
  const deselect = () => selectedSourceIndices.set([]);

  let selectedSnapshot: Source[] = [];

  const action = writable<"selecting" | "translating" | "rotating" | "resizing">("selecting");

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
  const rotationPivot = writable({ x: 0, y: 0 });
  const rotationDelta = writable(0);
  const rotationCursorDistance = writable(0);
  const calcDistance = (mouse: { clientX: number; clientY: number }) => {
    const localMouse = viewport.utils.screenToLocal({ x: mouse.clientX, y: mouse.clientY });
    const pivot = get(rotationPivot);

    const xDist = localMouse.x - pivot.x;
    const yDist = localMouse.y - pivot.y;
    rotationCursorDistance.set(Math.abs(Math.sqrt(xDist * xDist + yDist * yDist)));
  };

  const startRotation = ({ clientX, clientY }: PointerEvent) => {
    const bounds = get(selectionBounds);
    if (!bounds) return;

    selectedSnapshot = structuredClone(get(selectedSources));
    const pivot = { x: bounds.x, y: bounds.y };
    rotationPivot.set(pivot);
    rotationDelta.set(0);
    calcDistance({ clientX, clientY });
    isRotating = true;
    action.set("rotating");
  };

  onMount(() => {
    const pointermove = ({ clientX, clientY, shiftKey }: PointerEvent) => {
      if (!isRotating) return;
      const localMouse = viewport.utils.screenToLocal({ x: clientX, y: clientY });
      const pivot = get(rotationPivot);

      let rad =
        Math.atan2(localMouse.y - pivot.y, localMouse.x - pivot.x) + Math.PI / 2; /* 90 deg */
      if (shiftKey) {
        rad = Math.round(rad / (Math.PI / 4)) * (Math.PI / 4);
      }

      const angle = rad * (180 / Math.PI);

      rotationDelta.set(angle);
      calcDistance({ clientX, clientY });

      for (const source of selectedSnapshot) {
        const bounds = getBounds(source.transform);
        const rotated = rotatePoint({ x: bounds.x, y: bounds.y }, rad, pivot);

        managedSources.update(({ sources }) => {
          const target = sources.findIndex((t) => t.id === source.id);

          sources[target].transform.x = rotated.x;
          sources[target].transform.y = rotated.y;
          sources[target].transform.rotation =
            shiftKey && selectedSnapshot.length === 1 ? angle : source.transform.rotation + angle;
          sources[target].transform.rotation %= 360;

          sources[target].transform = {
            ...sources[target].transform,
          };

          return { sources };
        });
      }
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
  let resizeStart = { x: 0, y: 0 };
  let resizeBounds: Transform;
  let realCorner: ResizeSides;
  const startResizing = ({ clientX, clientY }: PointerEvent, side: ResizeSides) => {
    selectedSnapshot = structuredClone(get(selectedSources));
    if (selectedSnapshot.length === 1) {
      const mouseLocal = viewport.utils.screenToLocal({ x: clientX, y: clientY });
      realCorner = [
        mouseLocal.x > selectedSnapshot[0].transform.x ? "e" : "w",
        mouseLocal.y < selectedSnapshot[0].transform.y ? "n" : "s",
      ].join("") as ResizeSides;
    }
    resizeBounds = getBounds(...selectedSnapshot.map((s) => s.transform));
    resizeStart = viewport.utils.screenToLocal({ x: clientX, y: clientY });
    isResizing = side;
    action.set("resizing");
  };

  onMount(() => {
    const pointermove = ({ clientX, clientY }: PointerEvent) => {
      if (isResizing === false) return;

      const mouseLocal = viewport.utils.screenToLocal({ x: clientX, y: clientY });
      const mouseDelta = {
        x: mouseLocal.x - resizeStart.x,
        y: mouseLocal.y - resizeStart.y,
      };

      managedSources.update(({ sources }) => {
        if (isResizing === false) throw new Error("Bad resize value");

        const indices = get(selectedSourceIndices);
        if (selectedSnapshot.length === 1) {
          const idx = indices[0];
          const ref = selectedSnapshot[0];

          const rad = (-ref.transform.rotation * Math.PI) / 180;
          const angledDelta = rotatePoint(mouseDelta, rad);

          if (isResizing.startsWith("n")) angledDelta.y *= -1;
          if (isResizing.endsWith("w")) angledDelta.x *= -1;

          const scaleX = Math.max(0, (resizeBounds.width + angledDelta.x) / resizeBounds.width);
          const scaleY = Math.max(0, (resizeBounds.height + angledDelta.y) / resizeBounds.height);

          const newWidth = ref.transform.width * scaleX;
          const newHeight = ref.transform.height * scaleY;

          const newTransform = {
            ...ref.transform,
            width: newWidth,
            height: newHeight,
          };

          const newBounds = getBounds(newTransform);

          const [p1, p2] = transformToPoints(resizeBounds);
          const [np1, np2] = transformToPoints(newBounds);

          if (realCorner.includes("e")) newTransform.x += np2.x - p2.x;
          if (realCorner.includes("w")) newTransform.x += np1.x - p1.x;
          if (realCorner.includes("n")) newTransform.y += np1.y - p1.y;
          if (realCorner.includes("s")) newTransform.y += np2.y - p2.y;

          sources[idx].transform = newTransform;
        } else {
          // TODO: multiselect later
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

  return ctx;
}
