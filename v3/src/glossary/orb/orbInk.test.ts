import { describe, expect, it } from "vitest";
import { inkOn } from "./orbInk";

const fill = (n: number, ...rgb: number[]) => Array.from({ length: n }, () => [...rgb, 255]).flat();

describe("the letters over an orb", () => {
  it("are black on a light orb", () => {
    expect(inkOn(fill(100, 230, 200, 220))).toEqual({ ink: "dark", halo: false });
  });
  it("are white on a dark orb", () => {
    expect(inkOn(fill(100, 70, 40, 30))).toEqual({ ink: "light", halo: false });
  });
  it("ignore the darkest tenth (a vein) but not more", () => {
    expect(inkOn([...fill(95, 230, 200, 220), ...fill(5, 20, 20, 20)]).ink).toBe("dark");
    expect(inkOn([...fill(70, 230, 200, 220), ...fill(30, 20, 20, 20)]).halo).toBe(true);
  });
});
