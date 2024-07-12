import Color from "color";
import { createEffect, createSignal, onCleanup, onMount } from "solid-js";

type ColorPickerProps = {
  color?: string;
  onchange?: (color: Color) => void;
};

export function ColorPicker(props: ColorPickerProps) {
  let huesElement: HTMLDivElement;
  let SVElement: HTMLDivElement;

  let initial: number[] = [0, 0, 0];
  try {
    initial = props.color ? Color(props.color).hsv().array() : [0, 0, 0, 1];
  } catch {
    // Invalid color
  }

  const [hue, setHue] = createSignal(initial[0]);
  const [saturation, setSaturation] = createSignal(initial[1]);
  const [value, setValue] = createSignal(initial[2]);
  const [isAdjustingHue, setIsAdjustingHue] = createSignal(false);
  const [isAdjustingSV, setIsAdjustingSV] = createSignal(false);

  createEffect(() => {
    if (!isAdjustingHue() && !isAdjustingSV()) return;
    props.onchange?.(Color({ h: hue(), s: saturation(), v: value() }, "hsv"));
  });

  const windowPointerMove = (ev: PointerEvent) => {
    hue: {
      if (!isAdjustingHue()) break hue;
      let newHue = 0;
      const { x, width } = huesElement.getBoundingClientRect();
      newHue = ((ev.clientX - x) / width) * 360;
      // Clamp
      newHue = Math.min(Math.max(0, newHue), 360);
      setHue(newHue);
    }

    sv: {
      if (!isAdjustingSV()) break sv;
      let newSaturation = 0;
      let newValue = 0;
      const { x, y, width, height } = SVElement.getBoundingClientRect();
      newSaturation = ((ev.clientX - x) / width) * 100;
      newSaturation = Math.min(Math.max(0, newSaturation), 100);
      newValue = ((ev.clientY - y - height) / height) * -100;
      newValue = Math.min(Math.max(0, newValue), 100);
      setSaturation(newSaturation);
      setValue(newValue);
    }
  };
  const windowPointerUp = () => {
    setIsAdjustingHue(false);
    setIsAdjustingSV(false);
  };

  onMount(() => {
    window.addEventListener("pointermove", windowPointerMove);
    window.addEventListener("pointerup", windowPointerUp);
  });

  onCleanup(() => {
    window.removeEventListener("pointermove", windowPointerMove);
    window.removeEventListener("pointerup", windowPointerUp);
  });

  return (
    <div class="z-10 flex select-none flex-col gap-2 rounded bg-white p-2 shadow">
      <div
        class="relative inline-flex aspect-[3/4] h-56 w-56"
        style={{
          "background-color": `hsl(${hue()}deg, 100%, 50%)`,
        }}
        onpointerdown={() => setIsAdjustingSV(true)}
        ref={(el) => (SVElement = el)}
      >
        <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#fff_0%,#fff0_100%)]" />
        <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,#000_0%,#0000_100%)]" />
        <div
          class="absolute h-[4px] w-[4px] -translate-x-[2px] translate-y-[2px] rounded-full bg-white outline outline-2 outline-black"
          style={{
            left: `${saturation()}%`,
            bottom: `${value()}%`,
          }}
          onpointerdown={() => setIsAdjustingSV(true)}
        />
      </div>
      <div
        class="relative h-8 w-56 select-none rounded bg-[linear-gradient(to_right,red_0%,#ff0_17%,lime_33%,cyan_50%,blue_66%,#f0f_83%,red_100%)]"
        onpointerdown={() => setIsAdjustingHue(true)}
        ref={(el) => (huesElement = el)}
      >
        <div
          class="absolute h-[calc(100%+0.25rem)] -translate-x-1/2 -translate-y-0.5 rounded border-[4px] border-black"
          style={{
            left: `${(hue() / 360) * 100}%`,
            "background-color": `hsl(${hue()}deg, 100%, 50%)`,
          }}
          onpointerdown={() => setIsAdjustingHue(true)}
        />
      </div>
    </div>
  );
}
