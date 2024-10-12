import { jtox } from "./serialize.js";
import type { Source } from "$lib/types/source.js";

export function updateElementWithSource(element: HTMLElement, source: Source) {
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
        node.replaceWith(typeof child === "string" ? document.createTextNode(child) : jtox(child));
      }
    }
  } else {
    element.replaceChildren(
      ...source.children.map((s) => (typeof s === "string" ? document.createTextNode(s) : jtox(s))),
    );
  }
}
