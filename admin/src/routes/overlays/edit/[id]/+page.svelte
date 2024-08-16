<script lang="ts">
  import clsx from "clsx";
  import { Maximize } from "lucide-svelte";
  import { createEditor } from "$lib/hooks/editor";
  import { createViewport } from "$lib/hooks/viewport";
  import Viewport, { DEFAULT_GRID, DEFAULT_VIEW } from "./Viewport.svelte";
  import Selector from "./Selector.svelte";

  const {
    stores: { transform: viewportTransform },
    utils: { screenToLocal, localToScreen, panTo },
  } = createViewport({ initialView: DEFAULT_VIEW });
  const {
    sources,
    fragment,
    selection: {
      action,
      selectedSources,
      selectionBounds,
      singleSelect,
      addSelect,
      areaSelect,
      deselect,
      startTranslate,
      startRotation,
      rotationPivot,
      rotationDelta,
      rotationCursorDistance,
      startResizing,
    },
  } = createEditor([
    {
      id: "a",
      tag: "some-html",
      transform: {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
      },
      props: {},
      children: [],
    },
    {
      id: "b",
      tag: "some-html",
      transform: {
        x: 200,
        y: 200,
        width: 100,
        height: 100,
        rotation: 45,
      },
      props: {},
      children: [],
    },
    {
      id: "c",
      tag: "some-html",
      transform: {
        x: 200,
        y: 0,
        width: 100,
        height: 100,
        rotation: 90,
      },
      props: {},
      children: [],
    },
  ]);

  let frame: HTMLIFrameElement;
  $: if (frame && $sources && fragment) {
    const frameWindow = frame.contentWindow;
    if (!frameWindow) break $;
    frameWindow.document.body.innerHTML = "";
    frameWindow.document.body.append(fragment);
  }
</script>

<div class="absolute inset-0">
  <Viewport
    class="relative size-full select-none overflow-hidden text-slate-300"
    grid={DEFAULT_GRID}
  >
    <iframe
      title="overlay"
      class="pointer-events-none absolute left-0 top-0 h-[1080px] w-[1920px] select-none"
      frameborder="0"
      bind:this={frame}
    ></iframe>
    <div
      class="pointer-events-none absolute left-0 top-0 h-[1080px] w-[1920px] rounded-[1px] outline outline-slate-700"
    />
    <!-- Debug source transforms -->
    {#each $sources as source, idx}
      <button
        class="absolute grid place-content-center rounded-[1px] border-2 border-dashed border-slate-700/50 outline-none"
        style:left="{source.transform.x}px"
        style:top="{source.transform.y}px"
        style:width="{source.transform.width}px"
        style:height="{source.transform.height}px"
        style:transform="rotate({source.transform.rotation}deg)"
        on:click={(ev) => {
          if (ev.shiftKey) addSelect(idx);
          else singleSelect(idx);
        }}
        on:pointerdown={(ev) => {
          ev.stopPropagation();
        }}
      >
        {source.transform.rotation}
      </button>
    {/each}
    {#if $selectionBounds}
      {@const transformState =
        $action === "rotating"
          ? {
              left: `${$rotationPivot[0]}px`,
              top: `${$rotationPivot[1]}px`,
              width: `${$rotationCursorDistance * 2}px`,
              height: `${$rotationCursorDistance * 2}px`,
              transform: `translate(-50%, -50%) rotate(${$rotationDelta}deg)`,
            }
          : {
              left: `${$selectionBounds[0][0]}px`,
              top: `${$selectionBounds[0][1]}px`,
              width: `${$selectionBounds[1][0] - $selectionBounds[0][0]}px`,
              height: `${$selectionBounds[1][1] - $selectionBounds[0][1]}px`,
              transform: ``,
            }}

      <!-- Transform box -->
      <div
        class={clsx([
          "esc-pan absolute select-none",
          $action === "rotating"
            ? "transition-[background-color,border-radius]"
            : $action === "translating"
              ? "transition-[background-color,border-radius,width,height]"
              : $action === "resizing"
                ? "transition-[background-color,border-radius]"
                : "transition-[background-color,border-radius]",
          $action === "selecting" && "cursor-grab rounded-[1px] bg-blue-500/25",
          $action === "rotating" && "rounded-[100%] bg-pink-500/25",
          $action === "translating" && "rounded-[1px] bg-green-500/25",
          $action === "resizing" && "rounded-[1px] bg-yellow-500/25",
        ])}
        style:left={transformState.left}
        style:top={transformState.top}
        style:width={transformState.width}
        style:height={transformState.height}
        style:transform={transformState.transform}
        on:pointerdown={(ev) => {
          if ($action !== "selecting") return;
          ev.stopPropagation();
          startTranslate(ev);
        }}
      />

      <!-- Rotate guide line -->
      <div
        class={clsx([
          "absolute w-1 origin-top rounded-[1px] bg-pink-900",
          $action !== "rotating" && "transition-[height]",
        ])}
        style:left="{$rotationPivot[0]}px"
        style:top="{$rotationPivot[1]}px"
        style:height="{$action === "rotating" ? $rotationCursorDistance : 0}px"
        style:transform="translateX(-50%) rotate({$rotationDelta + 180}deg)"
      />

      <!-- Resize Handles -->
      {@const resizer = {
        ...($selectedSources.length === 1
          ? $selectedSources[0].transform
          : {
              x: $selectionBounds[0][0],
              y: $selectionBounds[0][1],
              width: $selectionBounds[1][0] - $selectionBounds[0][0],
              height: $selectionBounds[1][1] - $selectionBounds[0][1],
              rotation: 0,
            }),
      }}
      <div
        class={clsx([
          "esc-pan absolute rounded-[1px]",
          $action === "selecting" && "border border-blue-300",
        ])}
        style:left="{resizer.x}px"
        style:top="{resizer.y}px"
        style:width="{resizer.width}px"
        style:height="{resizer.height}px"
        style:transform="rotate({resizer.rotation}deg)"
        on:pointerdown={(ev) => {
          if ($action !== "selecting") return;
          ev.stopPropagation();
          startTranslate(ev);
        }}
      >
        <div
          class={clsx([
            "esc-pan absolute left-0 top-0 size-2.5 cursor-nw-resize rounded-tl-[1px] bg-blue-950 transition-transform",
            $action !== "selecting" && "scale-0",
          ])}
          on:pointerdown={(ev) => {
            ev.stopPropagation();
            startResizing(ev, "nw");
          }}
        />
        <div
          class={clsx([
            "esc-pan absolute right-0 top-0 size-2.5 cursor-ne-resize rounded-tr-[1px] bg-blue-950 transition-transform",
            $action !== "selecting" && "scale-0",
          ])}
          on:pointerdown={(ev) => {
            ev.stopPropagation();
            startResizing(ev, "ne");
          }}
        />
        <div
          class={clsx([
            "esc-pan absolute bottom-0 left-0 size-2.5 cursor-sw-resize rounded-bl-[1px] bg-blue-950 transition-transform",
            $action !== "selecting" && "scale-0",
          ])}
          on:pointerdown={(ev) => {
            ev.stopPropagation();
            startResizing(ev, "sw");
          }}
        />
        <div
          class={clsx([
            "esc-pan absolute bottom-0 right-0 size-2.5 cursor-se-resize rounded-br-[1px] bg-blue-950 transition-transform",
            $action !== "selecting" && "scale-0",
          ])}
          on:pointerdown={(ev) => {
            ev.stopPropagation();
            startResizing(ev, "se");
          }}
        />
      </div>
    {/if}
  </Viewport>
  {#key $viewportTransform}
    {#if $selectionBounds}
      {@const localBounds = [
        localToScreen($selectionBounds[0]),
        localToScreen($selectionBounds[1]),
      ]}

      <!-- Rotate Handle -->
      <div
        class={clsx(
          "esc-pan absolute size-4 -translate-x-1/2 -translate-y-full cursor-grab rounded-full bg-blue-950 transition-all",
          $action !== "selecting" && "scale-0",
        )}
        style:left="{localBounds[0][0] + (localBounds[1][0] - localBounds[0][0]) / 2}px"
        style:top="{localBounds[0][1] - 8}px"
        on:pointerdown={(ev) => {
          ev.stopPropagation();
          startRotation(ev);
        }}
      />
    {/if}
  {/key}
  <div class="absolute bottom-4 right-4">
    <button
      class="rounded border border-slate-200 bg-white p-2 shadow"
      on:click={() => panTo(DEFAULT_VIEW, 500)}
    >
      <Maximize />
    </button>
  </div>
  <Selector
    onselect={([start, end]) => {
      areaSelect([screenToLocal(start), screenToLocal(end)]);
    }}
    ondeselect={() => deselect()}
  />
</div>
