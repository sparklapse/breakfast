import { describe, it, expect } from "vitest";
import { getTransformBounds, transformFromAltPoints, transformFromPoints, transformToPoints } from "./transform";

describe("transforms", () => {
  it("converts a transform to points", () => {
    const [tl, br, tr, bl] = transformToPoints({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
    });

    expect(tl).toStrictEqual([0, 0]);
    expect(br).toStrictEqual([100, 100]);
    expect(tr).toStrictEqual([100, 0]);
    expect(bl).toStrictEqual([0, 100]);
  });

  it("converts a 90 degree rotated transform to points", () => {
    const [tl, br, tr, bl] = transformToPoints({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 90,
    });

    expect(tl[0]).toBeCloseTo(100);
    expect(tl[1]).toBeCloseTo(0);

    expect(br[0]).toBeCloseTo(0);
    expect(br[1]).toBeCloseTo(100);

    expect(tr[0]).toBeCloseTo(100);
    expect(tr[1]).toBeCloseTo(100);

    expect(bl[0]).toBeCloseTo(0);
    expect(bl[1]).toBeCloseTo(0);
  });

  it("converts a 45 degree rotated transform to points", () => {
    const [tl, br, tr, bl] = transformToPoints({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 45,
    });

    expect(tl[0]).toBeCloseTo(50);
    expect(tl[1]).toBeCloseTo(-20.7, 1);

    expect(br[0]).toBeCloseTo(50);
    expect(br[1]).toBeCloseTo(120.7, 1);

    expect(tr[0]).toBeCloseTo(120.7, 1);
    expect(tr[1]).toBeCloseTo(50);

    expect(bl[0]).toBeCloseTo(-20.7, 1);
    expect(bl[1]).toBeCloseTo(50);
  });

  it("converts a 90 degree rotated and translated transform to points", () => {
    const [tl, br, tr, bl] = transformToPoints({
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      rotation: 90,
    });

    expect(tl[0]).toBeCloseTo(200);
    expect(tl[1]).toBeCloseTo(100);

    expect(br[0]).toBeCloseTo(100);
    expect(br[1]).toBeCloseTo(200);

    expect(tr[0]).toBeCloseTo(200);
    expect(tr[1]).toBeCloseTo(200);

    expect(bl[0]).toBeCloseTo(100);
    expect(bl[1]).toBeCloseTo(100);
  });

  it("gets the bounds of a 45 degree rotated transform", () => {
    const [tl, br] = getTransformBounds({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 45,
    });

    expect(tl[0]).toBeCloseTo(-20.7, 1);
    expect(tl[1]).toBeCloseTo(-20.7, 1);

    expect(br[0]).toBeCloseTo(120.7, 1);
    expect(br[1]).toBeCloseTo(120.7, 1);
  });

  it("converts a transform to points and back", () => {
    const start = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 90,
    };
    const [tl, br] = transformToPoints(start);

    const transform = transformFromPoints(tl, br, 90);

    expect(transform).toStrictEqual(start);
  });

  it("converts a transform to points and back with opposite corners", () => {
    const start = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 90,
    };
    const [_tl, _br, tr, bl] = transformToPoints(start);

    const transform = transformFromAltPoints(tr, bl, 90);

    expect(transform).toStrictEqual(start);
  });
});
