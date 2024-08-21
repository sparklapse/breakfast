import { writable, derived, get, type Readable } from "svelte/store";
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
import { radToDeg } from "$lib/math/units";
import { BUILTIN_DEFINITIONS } from "$lib/editor/sources";
import type { Point, Transform } from "$lib/math";
import type { Source, Script, SourceDef } from "$lib/editor/types";

const MANAGED_STYLES = ["top", "left", "width", "height", "transform"];

export function createEditor(initial?: {
  label?: string;
  scene?: string;
  scripts?: Script[];
  sourceDefs?: SourceDef[];
}) {
  const viewport = useViewport(true);

  const label = writable(initial?.label ?? "");

  // MARK: Definitions
  const definitions = writable([...BUILTIN_DEFINITIONS, ...(initial?.sourceDefs ?? [])]);
  const addDefinition = (def: SourceDef) => {
    definitions.update((defs) => {
      if (defs.find((d) => d.tag === def.tag)) throw new Error("Definition already exists");
      return [...defs, def];
    });
  };

  const removeDefinition = (tag: string) => {
    definitions.update((defs) => defs.filter((d) => d.tag !== tag));
  };

  // MARK: Scene
  const managedScene = writable<{ fragment: DocumentFragment | HTMLElement }>({
    fragment: new DocumentFragment(),
  });
  const scene = derived(managedScene, ({ fragment }) => fragment);

  // MARK: Sources
  const sources = derived(managedScene, ({ fragment }) => {
    return Array.from(fragment.childNodes).map((child) => xtojSource(child as HTMLElement));
  });
  const updateElementWithSource = (element: HTMLElement, source: Source) => {
    element.id = source.id;

    for (const [prop, value] of Object.entries(source.props)) {
      element.setAttribute(prop, value);
    }

    for (const [prop, value] of Object.entries(source.style)) {
      element.style.setProperty(prop, value);
    }

    element.style.position = "absolute";
    element.style.left = `${source.transform.x}px`;
    element.style.top = `${source.transform.y}px`;
    element.style.width = `${source.transform.width}px`;
    element.style.height = `${source.transform.height}px`;
    element.style.transform = `rotate(${source.transform.rotation}deg)`;

    if (source.children.length === element.childNodes.length) {
      for (let i = 0; i < source.children.length; i++) {
        const node = element.childNodes[i];
        const child = source.children[i];
        if (node.nodeType === Node.TEXT_NODE && typeof child === "string") {
          node.textContent = child;
        } else if (node.nodeType === Node.ELEMENT_NODE && typeof child === "object") {
          updateElementWithSource(node as HTMLElement, child);
        } else {
          node.replaceWith(
            typeof child === "string" ? document.createTextNode(child) : jtoxSource(child),
          );
        }
      }
    } else {
      element.replaceChildren(
        ...source.children.map((s) => (typeof s === "string" ? s : jtoxSource(s))),
      );
    }
  };
  const jtoxSource = (source: Source): HTMLElement => {
    const element = document.createElement(source.tag);
    updateElementWithSource(element, source);

    for (const child of source.children) {
      if (typeof child === "string") {
        element.append(document.createTextNode(child));
        continue;
      }
      element.append(jtoxSource(child));
    }
    return element;
  };
  const xtojSource = (source: HTMLElement): Source => {
    const attributes: Record<string, string> = {};
    for (const { name, value } of source.attributes) {
      if (name === "style") continue;
      attributes[name] = value;
    }
    const { id, ...props } = attributes;
    const transform: Transform = {
      x: parseInt(source.style.left),
      y: parseInt(source.style.top),
      width: parseInt(source.style.width),
      height: parseInt(source.style.height),
      rotation: parseInt(source.style.transform.match(/(?<=rotate\()[-0-9.]+(?=deg)/)?.[0] || "0"),
    };

    let style: Record<string, string> = {};
    for (const prop of source.style) {
      if (MANAGED_STYLES.includes(prop)) continue;
      style[prop] = source.style.getPropertyValue(prop);
    }

    const children: (Source | string)[] = [];
    for (const child of source.childNodes) {
      if (typeof child === "string") {
        children.push(child);
        continue;
      }

      if (child instanceof Text || child.nodeType === 3) {
        children.push(child.textContent ?? "");
        continue;
      }

      if (child instanceof HTMLElement) {
        children.push(xtojSource(child));
        continue;
      }

      console.error("Child is not a valid type");
    }

    return {
      id,
      tag: source.tagName.toLowerCase(),
      transform,
      props,
      style,
      children,
    };
  };

  if (initial?.scene) {
    try {
      const fragment = document.createRange().createContextualFragment(initial.scene!);
      for (const node of fragment.childNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) xtojSource(node as HTMLElement);
        else if (node.nodeType === Node.TEXT_NODE) continue;
        else throw new Error("A node was not parsable by xtoj");
      }
      managedScene.set({ fragment });
    } catch (err) {
      console.error("Initial scene failed to load", err);
    }
  }

  // MARK: Source Manipulation
  const addSource = (source: Source) => {
    managedScene.update(({ fragment }) => {
      fragment.append(jtoxSource(source));
      return { fragment };
    });
  };

  const updateSource = (id: string, source: Source) => {
    managedScene.update(({ fragment }) => {
      const element = fragment.querySelector(`#${id}`);
      if (!element) return { fragment };

      updateElementWithSource(element as HTMLElement, source);
      return { fragment };
    });
  };

  const updateSourceField = (id: string, field: string, value: any) => {
    managedScene.update(({ fragment }) => {
      const element = fragment.querySelector(`#${id}`) as HTMLElement;
      if (!element) return { fragment };

      const [root, ...selector] = field.split(".") as [keyof Source, ...string[]];
      switch (root) {
        case "id": {
          element.id = value;
          break;
        }
        case "style": {
          if (!selector[0]) throw new Error("Must specify a style property to update");
          const style = selector[0];
          if (MANAGED_STYLES.includes(style)) throw new Error("Use transform to update this style");

          element.style.setProperty(style, value);
          break;
        }
        case "transform": {
          if (!selector[0]) throw new Error("Must specify a transform property to update");
          const transform = selector[0] as keyof Source["transform"];
          switch (transform) {
            case "x":
              element.style.setProperty("left", `${value}px`);
              break;
            case "y":
              element.style.setProperty("top", `${value}px`);
              break;
            case "width":
            case "height":
              element.style.setProperty(transform, `${value}px`);
              break;
            case "rotation":
              element.style.setProperty("transform", `rotate(${value}deg)`);
              break;
            default:
              throw new Error("Invalid transform value being set");
          }
          break;
        }
        case "props": {
          if (!selector[0]) throw new Error("Must specify a property to update");
          const property = selector[0];
          if (property === "style") throw new Error("Use style to update this prop");
          element.setAttribute(property, value);
          break;
        }
        case "children": {
          if (!Array.isArray(value)) throw new Error("Children must be an array");
          const children = value.map((v) => {
            if (typeof v === "string") return v;
            return jtoxSource(v);
          });
          element.replaceChildren(...children);
          break;
        }
        case "tag":
          throw new Error("Not allowed to change tag");
        default:
          throw new Error("Updating non-existant field");
      }

      return { fragment };
    });
  };

  const moveSourceUp = (id: string) => {
    managedScene.update(({ fragment }) => {
      const element = fragment.querySelector(`#${id}`) as HTMLElement;
      if (!element) throw new Error("Element with that id does not exist");

      if (element.nextSibling) (element.nextSibling as Element).after(element);
      return { fragment };
    });
  };

  const moveSourceDown = (id: string) => {
    managedScene.update(({ fragment }) => {
      const element = fragment.querySelector(`#${id}`) as HTMLElement;
      if (!element) throw new Error("Element with that id does not exist");

      if (element.previousSibling) (element.previousSibling as Element).before(element);
      return { fragment };
    });
  };

  const moveSourceToTop = (id: string) => {
    managedScene.update(({ fragment }) => {
      const element = fragment.querySelector(`#${id}`) as HTMLElement;
      if (!element) throw new Error("Element with that id does not exist");

      if (element.parentNode) element.parentNode.append(element);
      return { fragment };
    });
  };

  const moveSourceToBottom = (id: string) => {
    managedScene.update(({ fragment }) => {
      const element = fragment.querySelector(`#${id}`) as HTMLElement;
      if (!element) throw new Error("Element with that id does not exist");

      if (element.parentNode) element.parentNode.prepend(element);
      return { fragment };
    });
  };

  const removeSource = (id: string) => {
    selectedIds.update((ids) => ids.filter((i) => i !== id));
    managedScene.update(({ fragment }) => {
      fragment.querySelector(`#${id}`)?.remove();
      return { fragment };
    });
  };

  // MARK: Scripts
  const managedScripts = writable<{ scripts: Script[] }>({
    scripts: [...(initial?.scripts ?? [])],
  });
  const scripts = derived(managedScripts, ({ scripts }) => scripts);

  const addScript = (script: Script) => {
    if (get(scripts).find((s) => s.filename === script.filename))
      throw new Error("Script already exists");

    managedScripts.update(({ scripts }) => {
      scripts.push(script);
      return { scripts };
    });
  };

  const removeScript = (filename: string) => {
    managedScripts.update(({ scripts }) => {
      const idx = scripts.findIndex((s) => s.filename === filename);
      if (scripts[idx].builtin === true) throw new Error("Script is builtin and cannot be removed");

      if (idx !== -1) scripts.splice(idx, 1);
      return { scripts };
    });
  };

  // MARK: Mount
  const mount = (frame: HTMLIFrameElement) => {
    const cw = frame.contentWindow;
    if (!cw) throw new Error("Frame content window is unavailable");

    const load = () => {
      managedScene.update(({ fragment }) => {
        if (fragment.nodeType === Node.ELEMENT_NODE) cw.document.body.replaceWith(fragment);
        else if (fragment.nodeType === Node.DOCUMENT_FRAGMENT_NODE)
          cw.document.body.replaceChildren(fragment);
        else throw new Error("Bad fragment type");

        return { fragment: cw.document.body };
      });

      const $scripts = get(scripts);
      for (const { filename, script } of $scripts) {
        if (filename.endsWith(".js")) {
          const s = cw.document.createElement("script");
          s.innerHTML = script;
          cw.document.head.append(s);
        } else if (filename.endsWith(".css")) {
          const s = cw.document.createElement("style");
          s.innerHTML = script;
          cw.document.head.append(s);
        }
      }

      cw.document.body.style.overflow = "hidden";
    };
    frame.addEventListener("load", load);

    const unsubscribe = scripts.subscribe((p) => {
      // Pull the fragment out of the iframe and into memory where it wont be destroyed on reload
      managedScene.update(({ fragment }) => {
        return { fragment: fragment.cloneNode(true) as DocumentFragment | HTMLElement };
      });
      cw.location.reload();
    });

    return {
      destroy: () => {
        unsubscribe();
        frame.removeEventListener("load", load);
      },
    };
  };

  // MARK: Actions
  const action = writable<"selecting" | "translating" | "rotating" | "resizing">("selecting");

  const selectedIds = writable<string[]>([]);
  const selectedSources = derived([selectedIds, managedScene], ([$ids, { fragment }]) =>
    $ids.map((i) => xtojSource(fragment.querySelector(`#${i}`)! as HTMLElement)),
  );
  const selectedSource = derived(selectedSources, ($selectedSources) => {
    return $selectedSources.at(0);
  });
  const selectionBounds = derived(selectedSources, ($selectedSources) =>
    $selectedSources.length > 0
      ? getTransformBounds(...$selectedSources.map((s) => s.transform))
      : undefined,
  );
  const singleSelect = (id: string) => selectedIds.set([id]);
  const addSelect = (id: string) => selectedIds.update((prev) => [...prev, id]);
  const selectAll = () => selectedIds.set(get(sources).map((s) => s.id));
  const areaSelect = ([start, end]: [Point, Point]) => {
    let ids = [];

    const $sources = get(sources);
    const sourceBounds = $sources.map((s) => getTransformBounds(s.transform));
    for (let i = 0; i < $sources.length; i++) {
      const [tl, br] = sourceBounds[i];
      if (tl[0] >= start[0] && tl[1] >= start[1] && br[0] <= end[0] && br[1] <= end[1]) {
        ids.push($sources[i].id);
      }
    }
    selectedIds.set(ids);

    return ids.length;
  };
  const deselect = () => selectedIds.set([]);

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

      managedScene.update(({ fragment }) => {
        const ids = get(selectedIds);
        for (let i = 0; i < ids.length; i++) {
          const id = ids[i];
          const ref = selectedSnapshot[i];
          const updated = structuredClone(ref);
          updated.transform = {
            ...updated.transform,
            x: Math.round(ref.transform.x + delta.x),
            y: Math.round(ref.transform.y + delta.y),
          };

          updateElementWithSource(fragment.querySelector(`#${id}`)!, updated);
        }

        return { fragment };
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

      managedScene.update(({ fragment }) => {
        for (const source of selectedSnapshot) {
          const rotated = rotatePoint([source.transform.x, source.transform.y], rad, [
            pivot[0] - source.transform.width / 2,
            pivot[1] - source.transform.height / 2,
          ]);

          const target = get(sources).find((t) => t.id === source.id)!;
          const updated = structuredClone(target);

          updated.transform.x = rotated[0];
          updated.transform.y = rotated[1];
          updated.transform.rotation = source.transform.rotation + angle;
          updated.transform.rotation %= 360;

          updateElementWithSource(fragment.querySelector(`#${source.id}`)!, updated);
        }

        return { fragment };
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

      managedScene.update(({ fragment }) => {
        if (isResizing === false) throw new Error("Bad resize value");

        const ids = get(selectedIds);
        if (selectedSnapshot.length === 1) {
          const id = ids[0];
          const ref = selectedSnapshot[0];
          const updated = structuredClone(ref);
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
            updated.transform = transformFromPoints(tl, br, ref.transform.rotation);
          else updated.transform = transformFromAltPoints(tr, bl, ref.transform.rotation);

          updateElementWithSource(fragment.querySelector(`#${id}`)!, updated);
        } else {
          const delta = subPoints(mouseLocal, resizeStart);
          const width = resizeBounds[1][0] - resizeBounds[0][0];
          const height = resizeBounds[1][1] - resizeBounds[0][1];

          for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const ref = selectedSnapshot[i];
            const updated = structuredClone(ref);

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

            updated.transform.width = ref.transform.width * scale;
            updated.transform.height = ref.transform.height * scale;
            updated.transform.x = anchor[0] + offset[0] * scale;
            updated.transform.y = anchor[1] + offset[1] * scale;
            updateElementWithSource(fragment.querySelector(`#${id}`)!, updated);
          }
        }

        return { fragment };
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
    scene,
    mount,
    scripts: {
      scripts,
      addScript,
      removeScript,
    },
    sources: {
      sources,
      addSource,
      updateSource,
      updateSourceField,
      moveSourceUp,
      moveSourceDown,
      moveSourceToTop,
      moveSourceToBottom,
      removeSource,
      definitions: {
        subscribe: definitions.subscribe,
      } as Readable<SourceDef[]>,
      addDefinition,
      removeDefinition,
    },
    label,
    selection: {
      action,
      selectedIds,
      selectedSources,
      selectedSource,
      selectionBounds,
      singleSelect,
      addSelect,
      selectAll,
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
