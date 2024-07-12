import { For, createSignal, createUniqueId } from "solid-js";
import { Portal } from "solid-js/web";
import { Popover, Combobox, ToggleGroup } from "@ark-ui/solid";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Pipette,
  Underline,
  WrapText,
} from "lucide-solid";
import { ColorPicker } from "$app/components/common/ColorPicker";
import fonts from "./fonts.json";

import type { ComponentEditorProps, ComponentProps } from "$lib/core";

type Props = {
  text: string;
  font: [string, string];
  size: number;
  color: string;
  options: ("bold" | "italic" | "underline" | "pre")[];
  alignment: "left" | "center" | "right";
};

// Defaults
const DEFAULT_SIZE = 70;
const DEFAULT_COLOR = "white";
const DEFAULT_FONT = [
  "Gabarito",
  "https://cdn.jsdelivr.net/fontsource/fonts/gabarito:vf@latest/latin-wght-normal.woff2",
];
const DEFAULT_ALIGNMENT = "left";

// MARK: Editor
export function Editor({ data, setData }: ComponentEditorProps<Props>) {
  const [fontSearch, setFontSearch] = createSignal("");

  const results = () =>
    fontSearch()
      ? fonts
          .filter((f) => f.family.toLowerCase().includes(fontSearch().toLowerCase()))
          .slice(0, 20)
      : fonts.slice(0, 50);

  const getFontUrl = (id: string) => {
    return `https://cdn.jsdelivr.net/fontsource/fonts/${id}@5/latin-400-normal.woff2`;
  };

  return (
    <>
      <div class="flex flex-col">
        <label>Text</label>
        <textarea
          placeholder="Enter some text..."
          value={data.text ?? ""}
          oninput={(ev) => setData("text", ev.currentTarget.value)}
        />
      </div>
      <div>
        <label>Font: {data.font?.[0] ?? DEFAULT_FONT[0]}</label>
        <Combobox.Root items={results()} openOnChange openOnClick>
          <Combobox.Control>
            <Combobox.Input
              placeholder="Search for fonts"
              value={fontSearch()}
              onInput={(ev) => {
                setFontSearch(ev.currentTarget.value);
              }}
              onKeyDown={(ev) => {
                if (ev.key !== "Enter") return;
                const first = results().at(0);
                if (!first) return;

                setData("font", [first.family, getFontUrl(first.id)]);
                setFontSearch("");
              }}
            />
          </Combobox.Control>
          <Portal>
            <Combobox.Positioner data-component-source-editor>
              <Combobox.Content class="max-h-56 overflow-y-auto rounded bg-white py-2 shadow">
                <For each={results()}>
                  {(item) => (
                    <Combobox.Item
                      class="px-1 hover:bg-black/10"
                      item={item}
                      onClick={() => {
                        setData("font", [item.family, getFontUrl(item.id)]);
                      }}
                    >
                      <Combobox.ItemText>{item.family}</Combobox.ItemText>
                    </Combobox.Item>
                  )}
                </For>
              </Combobox.Content>
            </Combobox.Positioner>
          </Portal>
        </Combobox.Root>
        <sup>
          Powered by{" "}
          <a
            style={{ "text-decoration": "underline" }}
            href="https://fontsource.org/"
            target="_blank "
          >
            FontSource
          </a>
        </sup>
      </div>
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col">
          <label>Size</label>
          <input
            type="number"
            value={data.size ?? DEFAULT_SIZE}
            oninput={(ev) => setData("size", parseInt(ev.currentTarget.value))}
          />
        </div>
        <div class="flex flex-col">
          <div class="flex items-center justify-between gap-2">
            <label>Color</label>
            <Popover.Root>
              <Popover.Trigger>
                <Pipette size="1rem" />
              </Popover.Trigger>
              <Portal>
                <Popover.Positioner>
                  <Popover.Content data-component-source-editor>
                    <ColorPicker
                      color={data.color ?? DEFAULT_COLOR}
                      onchange={(c) => {
                        setData("color", c.hex());
                      }}
                    />
                  </Popover.Content>
                </Popover.Positioner>
              </Portal>
            </Popover.Root>
          </div>
          <input
            type="text"
            value={data.color ?? DEFAULT_COLOR}
            oninput={(ev) => setData("color", ev.currentTarget.value)}
          />
        </div>
      </div>
      <div class="flex items-center justify-between gap-2" style={{ "margin-top": "0.5rem" }}>
        <label>Options</label>
        <ToggleGroup.Root
          class="flex rounded border"
          defaultValue={[...(data.options ?? [])]}
          onValueChange={(ev) => {
            setData("options", ev.value as Props["options"]);
          }}
          multiple
        >
          <ToggleGroup.Item
            class="aspect-square p-1 hover:bg-black/10 [&[data-state=on]]:bg-black/10"
            value="bold"
          >
            <Bold size="1rem" />
          </ToggleGroup.Item>
          <ToggleGroup.Item
            class="aspect-square p-1 hover:bg-black/10 [&[data-state=on]]:bg-black/10"
            value="italic"
          >
            <Italic size="1rem" />
          </ToggleGroup.Item>
          <ToggleGroup.Item
            class="aspect-square p-1 hover:bg-black/10 [&[data-state=on]]:bg-black/10"
            value="underline"
          >
            <Underline size="1rem" />
          </ToggleGroup.Item>
          <ToggleGroup.Item
            class="aspect-square p-1 hover:bg-black/10 [&[data-state=on]]:bg-black/10"
            value="pre"
          >
            <WrapText size="1rem" />
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      </div>
      <div class="flex items-center justify-between gap-2" style={{ "margin-top": "0.5rem" }}>
        <label>Alignment</label>
        <ToggleGroup.Root
          class="flex rounded border"
          defaultValue={[data.alignment ?? DEFAULT_ALIGNMENT]}
          onValueChange={(ev) => {
            setData(
              "alignment",
              (ev.value[0] as Props["alignment"] | undefined) ?? DEFAULT_ALIGNMENT,
            );
          }}
        >
          <ToggleGroup.Item
            class="aspect-square p-1 hover:bg-black/10 [&[data-state=on]]:bg-black/10"
            value="left"
          >
            <AlignLeft size="1rem" />
          </ToggleGroup.Item>
          <ToggleGroup.Item
            class="aspect-square p-1 hover:bg-black/10 [&[data-state=on]]:bg-black/10"
            value="center"
          >
            <AlignCenter size="1rem" />
          </ToggleGroup.Item>
          <ToggleGroup.Item
            class="aspect-square p-1 hover:bg-black/10 [&[data-state=on]]:bg-black/10"
            value="right"
          >
            <AlignRight size="1rem" />
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      </div>
    </>
  );
}

// MARK: Component
export function Component({ data }: ComponentProps<Props>) {
  const fontId = createUniqueId();

  return (
    <>
      <Portal mount={document.head}>
        <style>{`
        @font-face {
          font-family: '${fontId}';
          src: url(${data.font?.[1] ?? DEFAULT_FONT[1]});
        }`}</style>
      </Portal>
      <p
        style={{
          color: data.color ?? DEFAULT_COLOR,
          "font-family": fontId,
          "font-size": `${data.size || DEFAULT_SIZE}px`,
          "font-weight": data.options?.includes("bold") ? "bold" : "normal",
          "font-style": data.options?.includes("italic") ? "italic" : "normal",
          "text-decoration": data.options?.includes("underline") ? "underline" : "inherit",
          "white-space": data.options?.includes("pre") ? "pre" : "normal",
          "text-align": data.alignment ?? DEFAULT_ALIGNMENT,
        }}
      >
        {data.text || "Select me to edit and add some text..."}
      </p>
    </>
  );
}
