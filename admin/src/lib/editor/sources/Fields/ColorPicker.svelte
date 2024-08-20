<script lang="ts">
  import Color from "color";
  import { DropdownMenu } from "bits-ui";

  export let label: string = "Color field";
  export let value: string | undefined = undefined;
  export let onchange: ((color: Color) => void) | undefined = undefined;

  let huesElement: HTMLDivElement;
  let svElement: HTMLDivElement;

  let initial = [0, 0, 0];
  try {
    initial = value ? Color(value).hsv().array() : [0, 0, 0, 1];
  } catch {
    // Bad color
  }

  let cHue = initial[0];
  let cSaturation = initial[1];
  let cValue = initial[2];
  let isAdjustingHue = false;
  let isAdjustingSV = false;

  $: hex = Color({ h: cHue, s: cSaturation, v: cValue }, "hsv").hex();

  let open = false;
</script>

<svelte:window
  on:pointermove={(ev) => {
    hue: {
      if (!isAdjustingHue) break hue;
      let newHue = 0;
      const { x, width } = huesElement.getBoundingClientRect();
      newHue = ((ev.clientX - x) / width) * 360;
      // Clamp
      newHue = Math.min(Math.max(0, newHue), 360);
      cHue = newHue;
    }

    sv: {
      if (!isAdjustingSV) break sv;
      let newSaturation = 0;
      let newValue = 0;
      const { x, y, width, height } = svElement.getBoundingClientRect();
      newSaturation = ((ev.clientX - x) / width) * 100;
      newSaturation = Math.min(Math.max(0, newSaturation), 100);
      newValue = ((ev.clientY - y - height) / height) * -100;
      newValue = Math.min(Math.max(0, newValue), 100);
      cSaturation = newSaturation;
      cValue = newValue;
    }

    if (isAdjustingHue || isAdjustingSV) {
      onchange?.(Color({ h: cHue, s: cSaturation, v: cValue }, "hsv"));
    }
  }}
  on:pointerup={() => {
    isAdjustingHue = false;
    isAdjustingSV = false;
  }}
/>

<div class="w-full">
  <p>{label}</p>
  <DropdownMenu.Root portal="body" bind:open>
    <DropdownMenu.Trigger class="w-full rounded px-2" style="background-color: {hex};">
      <span style:color={hex} style:filter="invert(1) saturate(0)">{hex}</span>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content>
      <div
        class="fixed inset-0"
        on:pointerdown={(ev) => {
          ev.stopPropagation();
          open = false;
        }}
        on:pointerup={(ev) => {
          if (isAdjustingHue || isAdjustingSV) {
            ev.stopPropagation();
            isAdjustingHue = false;
            isAdjustingSV = false;
          }
        }}
      />
      <div class="z-10 flex select-none flex-col gap-2 rounded bg-white p-2 shadow">
        <div
          class="relative inline-flex aspect-[3/4] h-56 w-56"
          style:background-color="hsl({cHue}deg, 100%, 50%)"
          on:pointerdown={(ev) => {
            ev.stopPropagation();
            isAdjustingSV = true;
          }}
          bind:this={svElement}
        >
          <div
            class="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#fff_0%,#fff0_100%)]"
          />
          <div
            class="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,#000_0%,#0000_100%)]"
          />
          <div
            class="absolute h-[4px] w-[4px] -translate-x-[2px] translate-y-[2px] rounded-full bg-white outline outline-2 outline-black"
            style:left="{cSaturation}%"
            style:bottom="{cValue}%"
            on:pointerdown={() => {
              isAdjustingSV = true;
            }}
          />
        </div>
        <div
          class="relative h-8 w-56 select-none rounded bg-[linear-gradient(to_right,red_0%,#ff0_17%,lime_33%,cyan_50%,blue_66%,#f0f_83%,red_100%)]"
          on:pointerdown={(ev) => {
            ev.stopPropagation();
            isAdjustingHue = true;
          }}
          bind:this={huesElement}
        >
          <div
            class="absolute h-[calc(100%+0.25rem)] -translate-x-1/2 -translate-y-0.5 rounded border-[4px] border-black"
            style:left="{(cHue / 360) * 100}%"
            style:background-color="hsl(${cHue}deg, 100%, 50%)"
            on:pointerdown={() => {
              isAdjustingHue = true;
            }}
          />
        </div>
      </div>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>
