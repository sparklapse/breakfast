import { Portal } from "solid-js/web";
import { Popover } from "@ark-ui/solid";
import { Pipette } from "lucide-solid";
import { ColorPicker } from "$app/components/common/ColorPicker";

import type { ComponentEditorProps, ComponentProps } from "$lib/core";

const DEFAULT_COLOR = "white";

type Props = {
  color: string;
};

// Define an editor to be able to control the data for your component
export function Editor({ data, setData }: ComponentEditorProps<Props>) {
  return (
    <>
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
    </>
  );
}

export function Component({ data }: ComponentProps<Props>) {
  return (
    <div
      class="absolute inset-0"
      style={{
        "background-color": data.color ?? DEFAULT_COLOR,
      }}
    />
  );
}
