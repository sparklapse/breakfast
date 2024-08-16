export type Point = { x: number; y: number };

export function rotatePoint(point: Point, radians: number, origin: Point = { x: 0, y: 0 }): Point {
  const rotatedX =
    (point.x - origin.x) * Math.cos(radians) - (point.y - origin.y) * Math.sin(radians);
  const rotatedY =
    (point.x - origin.x) * Math.sin(radians) + (point.y - origin.y) * Math.cos(radians);

  return {
    x: rotatedX + origin.x,
    y: rotatedY + origin.y,
  };
}

export function centerPoint(point: Point, center: Point): Point {
  return {
    x: center.x - point.x,
    y: center.y - point.y,
  };
}

export type Transform = Point & { width: number; height: number; rotation: number };

export function transformToPoints(transform: Transform, rotate: boolean = true): [Point, Point] {
  const radians = (transform.rotation * Math.PI) / 180;
  const p1 = { x: transform.x - transform.width / 2, y: transform.y - transform.height / 2 };
  const p2 = { x: transform.x + transform.width / 2, y: transform.y + transform.height / 2 };
  if (!rotate) return [p1, p2];

  const rp1 = rotatePoint(p1, radians, transform);
  const rp2 = rotatePoint(p2, radians, transform);
  return [rp1, rp2];
}

export function getBounds(...transforms: Transform[]): Transform {
  const tl: Point = {
    x: Infinity,
    y: Infinity,
  };
  const br: Point = {
    x: -Infinity,
    y: -Infinity,
  };

  for (const transform of transforms) {
    const { x, y, width, height, rotation } = transform;
    const rad = (rotation * Math.PI) / 180;
    const corners: Point[] = [
      { x: -(width / 2), y: -(height / 2) }, // Top-left
      { x: width / 2, y: -(height / 2) }, // Top-right
      { x: -(width / 2), y: height / 2 }, // Bottom-right
      { x: width / 2, y: height / 2 }, // Bottom-left
    ];

    for (let i = 0; i < corners.length; i++) {
      corners[i] = rotatePoint(corners[i], rad);

      corners[i].x += x;
      corners[i].y += y;
    }

    for (const point of corners) {
      if (point.x < tl.x) tl.x = point.x;
      if (point.x > br.x) br.x = point.x;
      if (point.y < tl.y) tl.y = point.y;
      if (point.y > br.y) br.y = point.y;
    }
  }

  return {
    x: (tl.x + br.x) / 2,
    y: (tl.y + br.y) / 2,
    width: br.x - tl.x,
    height: br.y - tl.y,
    rotation: 0,
  };
}
