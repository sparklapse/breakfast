import { rotatePoint, avgPoints } from "./point";
import type { Point, Transform } from "./types";
import { degToRad } from "./units";

/**
 *
 * @param transform
 * @param rotate
 * @returns [TopLeft, BottomRight, TopRight, BottomLeft]
 */
export function transformToPoints(transform: Transform): [Point, Point, Point, Point] {
  const radians = (transform.rotation * Math.PI) / 180;
  const tl: Point = [transform.x, transform.y];
  const br: Point = [transform.x + transform.width, transform.y + transform.height];
  const tr: Point = [transform.x + transform.width, transform.y];
  const bl: Point = [transform.x, transform.y + transform.height];

  const center = avgPoints(tl, br);
  const rtl = rotatePoint(tl, radians, center);
  const rbr = rotatePoint(br, radians, center);
  const rtr = rotatePoint(tr, radians, center);
  const rbl = rotatePoint(bl, radians, center);
  return [rtl, rbr, rtr, rbl];
}

export function transformFromPoints(tl: Point, br: Point, rotation: number): Transform {
  const rad = degToRad(rotation);
  const center = avgPoints(tl, br);
  const utl = rotatePoint(tl, rad, center);
  const ubr = rotatePoint(br, rad, center);

  return {
    x: utl[0],
    y: utl[1],
    width: ubr[0] - utl[0],
    height: ubr[1] - utl[1],
    rotation,
  };
}

export function transformFromAltPoints(tr: Point, bl: Point, rotation: number): Transform {
  const rad = degToRad(rotation);
  const center = avgPoints(tr, bl);
  const utr = rotatePoint(tr, rad, center);
  const ubl = rotatePoint(bl, rad, center);

  return {
    x: ubl[0],
    y: utr[1],
    width: utr[0] - ubl[0],
    height: ubl[1] - utr[1],
    rotation,
  };
}

export function getTransformBounds(...transforms: Transform[]): [Point, Point] {
  if (transforms.length === 0) throw Error("No transforms provided");

  const tl: Point = [Infinity, Infinity];
  const br: Point = [-Infinity, -Infinity];

  for (const transform of transforms) {
    const corners = transformToPoints(transform);

    for (const point of corners) {
      if (point[0] < tl[0]) tl[0] = point[0];
      if (point[0] > br[0]) br[0] = point[0];
      if (point[1] < tl[1]) tl[1] = point[1];
      if (point[1] > br[1]) br[1] = point[1];
    }
  }

  return [tl, br];
}
