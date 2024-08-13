<script lang="ts">
  import clsx from "clsx";

  type Point = {
    x: number;
    y: number;
  };

  type Transform = Point & {
    id: string;
    width: number;
    height: number;
    rotation: number;
  };

  function getRectVertices(transform: Transform): Point[] {
    const { x, y, width, height, rotation } = transform;

    // Convert rotation to radians
    const rad = (rotation * Math.PI) / 180;

    // Define the four corners relative to the center
    const corners: Point[] = [
      { x: 0, y: 0 }, // Top-left
      { x: width, y: 0 }, // Top-right
      { x: 0, y: height }, // Bottom-right
      { x: width, y: height }, // Bottom-left
    ];

    // Rotate and translate each corner
    for (let i = 0; i < corners.length; i++) {
      const rotatedX =
        (corners[i].x - width / 2) * Math.cos(rad) - (corners[i].y - height / 2) * Math.sin(rad);
      const rotatedY =
        (corners[i].x - width / 2) * Math.sin(rad) + (corners[i].y - height / 2) * Math.cos(rad);

      corners[i].x = rotatedX;
      corners[i].y = rotatedY;

      corners[i].x += x + width / 2;
      corners[i].y += y + height / 2;
    }

    return corners;
  }

  function getBounds(...transforms: Transform[]): Transform {
    const tl: Point = {
      x: Infinity,
      y: Infinity,
    };
    const br: Point = {
      x: -Infinity,
      y: -Infinity,
    };

    for (const transform of transforms) {
      const points = getRectVertices(transform);

      for (const point of points) {
        if (point.x < tl.x) tl.x = point.x;
        if (point.x > br.x) br.x = point.x;
        if (point.y < tl.y) tl.y = point.y;
        if (point.y > br.y) br.y = point.y;
      }
    }

    return {
      id: "bounds",
      x: tl.x,
      y: tl.y,
      width: br.x - tl.x,
      height: br.y - tl.y,
      rotation: 0,
    };
  }

  let transforms = [
    {
      id: "a",
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      rotation: 0,
    },
    {
      id: "b",
      x: 200,
      y: 200,
      width: 100,
      height: 100,
      rotation: 45,
    },
  ];

  $: bounds = transforms.map((t) => getBounds(t));

  let isSelecting = false;
  let isDragging = false;
  let isRotating = false;
  let selecting: Transform = {
    id: "selector",
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: 0,
  };
  let selected: Transform[] = [];
</script>

<div class="pointer-events-none absolute inset-0">
  {#each transforms as t}
    <div
      class="absolute bg-blue-800"
      style:left="{t.x}px"
      style:top="{t.y}px"
      style:width="{t.width}px"
      style:height="{t.height}px"
      style:transform="rotate({t.rotation}deg)"
    />
  {/each}
</div>

<!-- <div class="pointer-events-none absolute inset-0">
  {#each bounds as b}
    <div
      class="absolute bg-green-800/20"
      style:left="{b.x}px"
      style:top="{b.y}px"
      style:width="{b.width}px"
      style:height="{b.height}px"
    />
  {/each}
</div> -->

<div class="absolute inset-0 select-none">
  <div
    on:pointerdown={(ev) => {
      ev.stopPropagation();
      isDragging = true;
    }}
    class={clsx("absolute bg-red-500/25", isSelecting ? "origin-top-left" : "origin-center")}
    style:left="{selecting.x}px"
    style:top="{selecting.y}px"
    style:width="{Math.abs(selecting.width)}px"
    style:height="{Math.abs(selecting.height)}px"
    style:transform="rotate({selecting.rotation}deg) scaleX({selecting.width < 0 ? "-1" : "1"})
    scaleY({selecting.height < 0 ? "-1" : "1"})"
  >
    <div
      on:pointerdown={(ev) => {
        ev.stopPropagation();
        isRotating = true;
      }}
      class="absolute size-4 rounded-full bg-slate-700"
    />
  </div>
</div>

<svelte:window
  on:pointerdown={(ev) => {
    isSelecting = true;
    selecting = {
      id: "selector",
      x: ev.clientX,
      y: ev.clientY,
      width: 0,
      height: 0,
      rotation: 0,
    };
  }}
  on:pointermove={(ev) => {
    select: {
      if (!isSelecting) break select;
      selecting = {
        ...selecting,
        width: ev.clientX - selecting.x,
        height: ev.clientY - selecting.y,
      };
    }

    drag: {
      if (!isDragging) break drag;

      selecting = {
        ...selecting,
        x: selecting.x + ev.movementX,
        y: selecting.y + ev.movementY,
      };

      for (const select of selected) {
        const idx = transforms.findIndex((t) => t.id === select.id);
        select.x += ev.movementX;
        select.y += ev.movementY;
        transforms[idx].x += ev.movementX;
        transforms[idx].y += ev.movementY;
      }

      transforms = [...transforms];
    }

    rotate: {
      if (!isRotating) break rotate;
      const rad =
        Math.atan2(
          ev.clientY - (selecting.y + selecting.height / 2),
          ev.clientX - (selecting.x + selecting.width / 2),
        ) +
        Math.PI / 2; /* 90 deg */
      const angle = rad * (180 / Math.PI);

      selecting = {
        ...selecting,
        rotation: angle,
      };

      for (const transform of selected) {
        const bounds = getBounds(transform);
        const anchorX = bounds.x + bounds.width / 2;
        const anchorY = bounds.y + bounds.height / 2;
        const originX = selecting.x + selecting.width / 2;
        const originY = selecting.y + selecting.height / 2;
        const rotatedX = (anchorX - originX) * Math.cos(rad) - (anchorY - originY) * Math.sin(rad);
        const rotatedY = (anchorX - originX) * Math.sin(rad) + (anchorY - originY) * Math.cos(rad);

        const target = transforms.findIndex((t) => t.id === transform.id);
        transforms[target].x = rotatedX + originX + (transform.x - anchorX);
        transforms[target].y = rotatedY + originY + (transform.y - anchorY);
        transforms[target].rotation = transform.rotation + angle;

        transforms[target] = {
          ...transforms[target],
        };
      }

      // transforms = [...transforms];
    }
  }}
  on:pointerup={(ev) => {
    if (isSelecting) {
      isSelecting = false;

      selected = [];

      if (selecting.width < 0) {
        selecting.x += selecting.width;
        selecting.width = Math.abs(selecting.width);
      }

      if (selecting.height < 0) {
        selecting.y += selecting.height;
        selecting.height = Math.abs(selecting.height);
      }

      for (let i = 0; i < bounds.length; i++) {
        const bound = bounds[i];
        if (
          selecting.x <= bound.x &&
          selecting.y <= bound.y &&
          selecting.x + selecting.width >= bound.x + bound.width &&
          selecting.y + selecting.height >= bound.y + bound.height
        ) {
          selected.push(structuredClone(transforms[i]));
        }
      }

      if (selected.length === 0) {
        return;
      }

      selecting = getBounds(...selected);
    }

    if (isDragging) {
      isDragging = false;
    }

    if (isRotating) {
      isRotating = false;
    }
  }}
/>
