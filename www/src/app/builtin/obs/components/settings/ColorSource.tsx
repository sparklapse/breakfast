import Color from "color";
import { createEffect, createSignal } from "solid-js";
import { Portal } from "solid-js/web";
import { Menu } from "@ark-ui/solid";
import { Pipette } from "lucide-solid";
import { ColorPicker } from "$app/components/common/ColorPicker";
import type { SettingsProps } from ".";

export function ColorSourceSettings(props: SettingsProps) {
  /**
   * OBS stores color values in ABGR format so we need to reverse the string
   */
  const [color, setColor] = createSignal(
    typeof props.settings.color === "number"
      ? Color(props.settings.color).hex()
      : "#ffffff",
  );

  createEffect(() => {
    let c: Color;
    try {
      c = Color(color());
    } catch {
      // Invalid color
      return;
    }

    props.setSettings("color", c.rgbNumber());
  });

  return (
    <div class="w-1/2">
      <div class="flex items-center justify-between">
        <p>Color</p>
        <Menu.Root>
          <Menu.Trigger>
            <Pipette size="1rem" />
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner data-component-source-editor>
              <Menu.Content>
                <ColorPicker
                  color={color()}
                  onchange={(c) => {
                    setColor(c.hex());
                  }}
                />
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </div>
      <input
        type="text"
        value={color()}
        oninput={(ev) => {
          setColor(ev.currentTarget.value);
        }}
      />
    </div>
  );
}
