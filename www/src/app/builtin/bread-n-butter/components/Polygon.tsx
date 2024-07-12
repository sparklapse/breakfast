import { Portal } from "solid-js/web";
import { Popover } from "@ark-ui/solid";
import { Pipette } from "lucide-solid";
import { ColorPicker } from "$app/components/common/ColorPicker";

import type { ComponentEditorProps, ComponentProps } from "$lib/core";

const DEFAULT_SIDES = 3;
const DEFAULT_COLOR = "white";

type Props = {
  sides: number;
  color: string;
};

export function Editor({ data, setData }: ComponentEditorProps<Props>) {
  return (
    <>
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col">
          <label>Sides</label>
          <input
            type="number"
            min={3}
            value={data.sides ?? DEFAULT_SIDES}
            oninput={(ev) => setData("sides", parseInt(ev.currentTarget.value) || DEFAULT_SIDES)}
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
    </>
  );
}

export function Component({ data }: ComponentProps<Props>) {
  const sides = () => data.sides ?? DEFAULT_SIDES;
  const points = (): [string, string][] => {
    const s = sides();
    const section = (Math.PI * 2) / s;

    let arr: [number, number][] = [];
    for (let i = 0; i < s; i++) {
      const x = 50 + 50 * Math.cos(section * i - Math.PI / 2);
      const y = 50 + 50 * Math.sin(section * i - Math.PI / 2);

      arr.push([x, y]);
    }

    const bounds = arr.reduce(
      (prev, curr) => {
        if (curr[0] > prev.max.x) prev.max.x = curr[0];
        if (curr[1] > prev.max.y) prev.max.y = curr[1];

        if (curr[0] < prev.min.x) prev.min.x = curr[0];
        if (curr[1] < prev.min.y) prev.min.y = curr[1];

        return prev;
      },
      { min: { x: Infinity, y: Infinity }, max: { x: -Infinity, y: -Infinity } },
    );

    const average = {
      x: (bounds.min.x + bounds.max.x) / 2,
      y: (bounds.min.y + bounds.max.y) / 2,
    };

    const difference = {
      x: (average.x - 50) / 2,
      y: (average.y - 50) / 2,
    };

    arr.forEach((p) => {
      p[0] -= difference.x;
      p[1] -= difference.y;
    });

    return arr.map((p) => p.map((v) => `${v}%`) as [string, string]);
  };

  return (
    <>
      <div
        class="absolute inset-0"
        style={{
          "clip-path": `polygon(${points()
            .map((p) => p.join(" "))
            .join(",")})`,
          "background-color": data.color ?? DEFAULT_COLOR,
        }}
      />
    </>
  );
}
