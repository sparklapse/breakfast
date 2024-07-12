import { Show, createUniqueId } from "solid-js";
import { Portal } from "solid-js/web";
import { Popover } from "@ark-ui/solid";
import { Pipette } from "lucide-solid";
import { ColorPicker } from "$app/components/common/ColorPicker";

import type { ComponentEditorProps, ComponentProps } from "$lib/core";

// Specify what data your component takes
type Props = {
  color: string;
  background: string;
  size: number;
  spacing: number;
  animation:
    | false
    | {
        xSpeed: number;
        ySpeed: number;
      };
};

const DEFAULT_SIZE = 2;
const DEFAULT_SPACING = 20;
const DEFAULT_BACKGROUND = "transparent";
const DEFAULT_COLOR = "white";

// Define an editor to be able to control the data for your component
export function Editor({ data, setData }: ComponentEditorProps<Props>) {
  return (
    <>
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col">
          <label>Size</label>
          <input
            type="number"
            value={data.size ?? DEFAULT_SIZE}
            oninput={(ev) => {
              const value = parseFloat(ev.currentTarget.value);
              if (Number.isNaN(value)) return;

              setData("size", value);
            }}
          />
        </div>
        <div class="flex flex-col">
          <label>Spacing</label>
          <input
            type="number"
            value={data.spacing ?? DEFAULT_SPACING}
            oninput={(ev) => {
              const value = parseFloat(ev.currentTarget.value);
              if (Number.isNaN(value)) return;

              setData("spacing", value);
            }}
          />
        </div>
      </div>
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col">
          <div class="flex items-center justify-between gap-2">
            <label>Background</label>
            <Popover.Root>
              <Popover.Trigger>
                <Pipette size="1rem" />
              </Popover.Trigger>
              <Portal>
                <Popover.Positioner>
                  <Popover.Content data-component-source-editor>
                    <ColorPicker
                      color={data.background ?? DEFAULT_BACKGROUND}
                      onchange={(c) => {
                        setData("background", c.hex());
                      }}
                    />
                  </Popover.Content>
                </Popover.Positioner>
              </Portal>
            </Popover.Root>
          </div>
          <input
            type="text"
            value={data.background ?? DEFAULT_BACKGROUND}
            oninput={(ev) => setData("background", ev.currentTarget.value)}
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
      <div class="flex items-center gap-2">
        <label for="animation-enabled">Animation</label>
        <input
          style={{ width: "fit-content" }}
          type="checkbox"
          name="animation-enabled"
          checked={data.animation !== false}
          oninput={(ev) => {
            if (ev.currentTarget.checked) setData("animation", { xSpeed: 10, ySpeed: 10 });
            else setData("animation", false);
          }}
        />
      </div>
      <Show when={data.animation}>
        {(animation) => (
          <div class="flex items-center justify-between gap-2">
            <div class="flex flex-col">
              <label>X Speed</label>
              <input
                type="number"
                value={animation().xSpeed}
                oninput={(ev) => {
                  const value = parseFloat(ev.currentTarget.value);
                  if (Number.isNaN(value)) return;

                  setData("animation", "xSpeed", value);
                }}
              />
            </div>
            <div class="flex flex-col">
              <label>Y Speed</label>
              <input
                type="number"
                value={animation().ySpeed}
                oninput={(ev) => {
                  const value = parseFloat(ev.currentTarget.value);
                  if (Number.isNaN(value)) return;

                  setData("animation", "ySpeed", value);
                }}
              />
            </div>
          </div>
        )}
      </Show>
    </>
  );
}

export function Component({ data }: ComponentProps<Props>) {
  const animationId = createUniqueId();

  const animationStyle = () => `
    @keyframes ${animationId}-x {
      100% {
        background-position-x: ${data.spacing ?? DEFAULT_SPACING}px;
      }
    }
    @keyframes ${animationId}-y {
      100% {
        background-position-y: ${data.spacing ?? DEFAULT_SPACING}px;
      }
    }
  `;

  const xSpeed = () => (data.animation ? 1 / data.animation.xSpeed : 0);
  const ySpeed = () => (data.animation ? 1 / data.animation.ySpeed : 0);

  const animation = () =>
    data.animation
      ? [
          Number.isFinite(xSpeed())
            ? `${animationId}-x ${Math.abs(10 / data.animation.xSpeed)}s linear ${
                data.animation.xSpeed > 0 ? "normal" : "reverse"
              } infinite`
            : null,
          ,
          Number.isFinite(ySpeed())
            ? `${animationId}-y ${Math.abs(10 / data.animation.ySpeed)}s linear ${
                data.animation.ySpeed > 0 ? "normal" : "reverse"
              } infinite`
            : null,
        ].filter((a) => a !== null)
      : ["none"];

  return (
    <>
      <Portal mount={document.head}>
        <style>{animationStyle()}</style>
      </Portal>
      <div
        class="absolute inset-0 h-full w-full"
        style={{
          animation: animation().join(","),
          "background-color": data.background ?? DEFAULT_BACKGROUND,
          "background-image": `radial-gradient(${data.color ?? DEFAULT_COLOR} ${
            data.size ?? DEFAULT_SIZE
          }px, transparent 0)`,
          "background-size": `${data.spacing ?? DEFAULT_SPACING}px ${
            data.spacing ?? DEFAULT_SPACING
          }px`,
          "background-position": "0px 0px",
          "background-repeat": "repeat",
        }}
      />
    </>
  );
}
