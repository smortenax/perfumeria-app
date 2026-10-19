import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { partsText } from "./format";

const total = Ratio.of(1_000_000n);
const of = (ug: bigint) => partsText(Ratio.of(ug), total);

describe("parts of 1000 (V3-58: to the unit, and a tenth below 1)", () => {
  it("to the unit from 1 up", () => {
    expect(of(438_596n)).toBe("439");
    expect(of(1_000n)).toBe("1");
    expect(of(1_400n)).toBe("1");
    expect(of(1_000_000n)).toBe("1000");
  });

  it("a tenth below 1, so that a small material does not read as 0", () => {
    expect(of(400n)).toBe("0,4");
    expect(of(960n)).toBe("1");
    expect(of(50n)).toBe("0,1");
    expect(of(40n)).toBe("< 0,1");
  });
});
