<script lang="ts">
  import clsx from "clsx";
  import { useEditor } from "$lib/hooks/editor";
  import { useViewport } from "$lib/hooks/viewport";

  const {
    selection: {
      action,
      selectedSources,
      selectionBounds,
      startTranslate,
      startRotation,
      rotationPivot,
      rotationCursorDistance,
      rotationDelta,
      startResizing,
    },
  } = useEditor();
  const {
    stores: { transform: viewportTransform },
    utils: { localToScreen },
  } = useViewport();
</script>

{#if $selectionBounds}
  {@const localBounds = $selectionBounds
    ? [localToScreen($selectionBounds[0]), localToScreen($selectionBounds[1])]
    : [
        [0, 0],
        [0, 0],
      ]}

  {@const localRotationPivot = localToScreen($rotationPivot)}

  {@const localTransformPos =
    $selectedSources.length === 1
      ? localToScreen([$selectedSources[0].transform.x, $selectedSources[0].transform.y])
      : [0, 0]}

  {@const transformState =
    $action === "rotating"
      ? {
          left: `${localRotationPivot[0]}px`,
          top: `${localRotationPivot[1]}px`,
          width: `${$rotationCursorDistance * 2 * $viewportTransform.k}px`,
          height: `${$rotationCursorDistance * 2 * $viewportTransform.k}px`,
          transform: `translate(-50%, -50%) rotate(${$rotationDelta}deg)`,
        }
      : {
          left: `${localBounds[0][0]}px`,
          top: `${localBounds[0][1]}px`,
          width: `${localBounds[1][0] - localBounds[0][0]}px`,
          height: `${localBounds[1][1] - localBounds[0][1]}px`,
          transform: ``,
        }}

  {@const resizer = {
    ...($selectedSources.length === 1
      ? {
          x: localTransformPos[0],
          y: localTransformPos[1],
          width: $selectedSources[0].transform.width * $viewportTransform.k,
          height: $selectedSources[0].transform.height * $viewportTransform.k,
          rotation: $selectedSources[0].transform.rotation,
        }
      : {
          x: localBounds[0][0],
          y: localBounds[0][1],
          width: localBounds[1][0] - localBounds[0][0],
          height: localBounds[1][1] - localBounds[0][1],
          rotation: 0,
        }),
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

  {#key $viewportTransform}
    <!-- Rotate Handle -->
    <div
      class={clsx(
        "esc-pan absolute size-4 -translate-x-1/2 -translate-y-full cursor-grab select-none rounded-full bg-blue-950 transition-transform",
        $action !== "selecting" && "scale-0",
      )}
      style:left="{localBounds[0][0] + (localBounds[1][0] - localBounds[0][0]) / 2}px"
      style:top="{localBounds[0][1] - 8}px"
      on:pointerdown={(ev) => {
        ev.stopPropagation();
        startRotation(ev);
      }}
    />

    <!-- Rotate guide line -->
    <div
      class={clsx([
        "absolute w-1 origin-top rounded-[1px] bg-pink-900",
        $action !== "rotating" && "transition-[height]",
      ])}
      style:left="{localRotationPivot[0]}px"
      style:top="{localRotationPivot[1]}px"
      style:height="{$action === "rotating" ? $rotationCursorDistance * $viewportTransform.k : 0}px"
      style:transform="translateX(-50%) rotate({$rotationDelta + 180}deg)"
    />

    <!-- Resize Handles -->
    <div
      class={clsx([
        "esc-pan absolute select-none rounded-[1px]",
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
          "esc-pan absolute left-0 top-0 size-4 cursor-nw-resize rounded-tl-[1px] bg-blue-950 transition-transform",
          $action !== "selecting" && "scale-0",
        ])}
        on:pointerdown={(ev) => {
          ev.stopPropagation();
          startResizing(ev, "nw");
        }}
      />
      <div
        class={clsx([
          "esc-pan absolute right-0 top-0 size-4 cursor-ne-resize rounded-tr-[1px] bg-blue-950 transition-transform",
          $action !== "selecting" && "scale-0",
        ])}
        on:pointerdown={(ev) => {
          ev.stopPropagation();
          startResizing(ev, "ne");
        }}
      />
      <div
        class={clsx([
          "esc-pan absolute bottom-0 left-0 size-4 cursor-sw-resize rounded-bl-[1px] bg-blue-950 transition-transform",
          $action !== "selecting" && "scale-0",
        ])}
        on:pointerdown={(ev) => {
          ev.stopPropagation();
          startResizing(ev, "sw");
        }}
      />
      <div
        class={clsx([
          "esc-pan absolute bottom-0 right-0 size-4 cursor-se-resize rounded-br-[1px] bg-blue-950 transition-transform",
          $action !== "selecting" && "scale-0",
        ])}
        on:pointerdown={(ev) => {
          ev.stopPropagation();
          startResizing(ev, "se");
        }}
      />
    </div>
  {/key}
{/if}
