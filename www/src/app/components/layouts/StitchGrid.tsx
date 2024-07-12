import clsx from "clsx";
import { A } from "@solidjs/router";
import { For } from "solid-js";
import { Dynamic } from "solid-js/web";
import type { JSX, ParentProps } from "solid-js";

type StitchGridProps = ParentProps & {
  header?: string | JSX.Element;
  footer?: string | JSX.Element;
  links: {
    href: string;
    label: string;
    icon: (props: { class: string; size: string }) => JSX.Element;
  }[];
};

export default function StitchGridLayout(props: StitchGridProps) {
  return (
    <div class="absolute inset-0 grid place-content-center">
      <div class="flex flex-col gap-2 p-2">
        <div class="text-5xl drop-shadow">{props.header}</div>
        <div class="grid grid-cols-3 gap-4">
          <For each={props.links}>
            {(item) => (
              <A
                class={clsx([
                  "grid aspect-square size-28 place-content-center text-center text-2xl max-md:size-24 max-md:text-xl",
                  "rounded-lg p-4 outline-dashed outline-4 outline-black/15 hover:outline-0",
                  "shadow-none transition-all duration-150 ease-in-out hover:scale-105 hover:shadow-lg",
                  "hover:text-dui-maceron-500 hover:bg-white",
                ])}
                href={item.href}
              >
                <Dynamic component={item.icon} class="mx-auto" size="2.5rem" />
                <span>{item.label}</span>
              </A>
            )}
          </For>
          {props.children}
        </div>
        <div class="flex">{props.footer}</div>
      </div>
    </div>
  );
}
