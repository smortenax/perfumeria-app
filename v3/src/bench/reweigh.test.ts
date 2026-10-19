import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { readReweigh } from "./reweigh";

const G = 1_000_000n;
const held = Ratio.of(5n * G); // 5 g in the bottle

describe("Repesar, when you decide (V3-57)", () => {
  it("with the bottle: the gross, and the app takes off the tare", () => {
    expect(readReweigh("withBottle", "28,5", 25n * G, held)).toEqual({ grossUg: 28_500_000n, tareUg: 25n * G });
  });

  it("with the bottle tared on the scale: what is left, with no tare", () => {
    expect(readReweigh("tared", "3,5", 25n * G, held)).toEqual({ grossUg: 3_500_000n, tareUg: 0n });
    // Without a known tare, this is the way that works.
    expect(readReweigh("tared", "3,5", null, held)).toEqual({ grossUg: 3_500_000n, tareUg: 0n });
    expect(readReweigh("withBottle", "28,5", null, held)).toHaveProperty("error");
  });

  it("refuses what cannot be: more than it held, nothing left, a figure in mg, an empty bottle", () => {
    expect(readReweigh("withBottle", "31", 25n * G, held)).toHaveProperty("error");
    expect(readReweigh("tared", "6", null, held)).toHaveProperty("error");
    expect(readReweigh("withBottle", "25", 25n * G, held)).toHaveProperty("error");
    expect(readReweigh("tared", "3500", null, held)).toHaveProperty("error");
    expect(readReweigh("tared", "1", null, Ratio.ZERO)).toHaveProperty("error");
  });
});
