import { updateElementWithSource } from "./update.js";
import type { Transform } from "$lib/logic/math/transform.js";
import type { Source } from "$lib/types/source.js";

const MANAGED_STYLES = ["top", "left", "width", "height", "transform"];

export function jtox(source: Source): HTMLElement {
  const element = document.createElement(source.tag);
  updateElementWithSource(element, source);
  return element;
}

export function xtoj(source: HTMLElement): Source {
  const attributes: Record<string, string> = {};
  for (const { name, value } of source.attributes) {
    if (name === "style") continue;
    attributes[name] = value;
  }
  const { id, ...props } = attributes;
  const transform: Transform = {
    x: parseFloat(source.style.left),
    y: parseFloat(source.style.top),
    width: parseFloat(source.style.width),
    height: parseFloat(source.style.height),
    rotation: parseFloat(source.style.transform.match(/(?<=rotate\()[-0-9.]+(?=deg)/)?.[0] || "0"),
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
      children.push(xtoj(child));
      continue;
    }

    console.error("Child is not a valid type", child);
  }

  return {
    id,
    tag: source.tagName.toLowerCase(),
    transform,
    props,
    style,
    children,
  };
}
