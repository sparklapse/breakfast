import { describe, it, expect } from "vitest";
import { avgPoints, rotatePoint, subPoints, sumPoints } from "./point";
import { degToRad } from "./units";

describe("points", () => {
  it("sums 3 points", () => {
    const [x, y] = sumPoints([1, 1], [2, 2], [3, 3]);

    expect(x).toBe(6);
    expect(y).toBe(6);
  });

  it("subtracts 3 points", () => {
    const [x, y] = subPoints([1, 1], [2, 2], [3, 3]);

    expect(x).toBe(-4);
    expect(y).toBe(-4);
  });

  it("rotates a point [100,0] 90 degrees cw", () => {
    const radians = degToRad(90);
    const [x, y] = rotatePoint([100, 0], radians);

    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(-100);
  });

  it("rotates a point [100,0] 45 degrees cw", () => {
    const radians = degToRad(45);
    const [x, y] = rotatePoint([100, 0], radians);

    expect(x).toBeCloseTo(70.7, 1);
    expect(y).toBeCloseTo(-70.7, 1);
  });

  it("centers 2 points", () => {
    const [x, y] = avgPoints([-100, -100], [100, 100]);

    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(0);
  });
});
