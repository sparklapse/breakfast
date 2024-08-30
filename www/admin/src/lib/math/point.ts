import type { Point } from "./types";

export function sumPoints(...points: Point[]): Point {
  return [points.reduce((a, p) => a + p[0], 0), points.reduce((a, p) => a + p[1], 0)];
}

export function subPoints(...points: Point[]): Point {
  return [
    points.slice(1).reduce((a, p) => a - p[0], points[0][0]),
    points.slice(1).reduce((a, p) => a - p[1], points[0][1]),
  ];
}

export function avgPoints(...points: Point[]): Point {
  if (points.length === 0) throw new Error("No points provided");
  return [
    points.reduce((a, p) => a + p[0], 0) / points.length,
    points.reduce((a, p) => a + p[1], 0) / points.length,
  ];
}

export function rotatePoint(point: Point, radians: number, origin: Point = [0, 0]): Point {
  const rotatedX =
    (point[0] - origin[0]) * Math.cos(radians) - (point[1] - origin[1]) * Math.sin(radians);
  const rotatedY =
    (point[0] - origin[0]) * Math.sin(radians) + (point[1] - origin[1]) * Math.cos(radians);

  return [rotatedX + origin[0], rotatedY + origin[1]];
}

export function boundsCenter(bounds: [Point, Point]): Point {
  return [(bounds[1][0] - bounds[0][0]) / 2, (bounds[1][1] - bounds[0][1]) / 2];
}
