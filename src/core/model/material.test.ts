import { describe, expect, it } from "vitest";
import { Ratio } from "../arith/ratio";
import { compose, vectorOf } from "../compose";
import type { Formula } from "./formula";
import { provisionalKey, type Material } from "./material";

const header = { name: "", intention: "", container: null, workBatchUg: null, finalBatchUg: null };
const provisional = (name: string): Material => ({ key: provisionalKey(name), kind: "provisional", name });

describe("a provisional material is known by its name (P44)", () => {
  it("is the same whatever its capitals, accents or spaces", () => {
    expect(provisionalKey("Sandalmysore Core")).toBe("prov:sandalmysore core");
    expect(provisionalKey("  sandalmysore   CORE ")).toBe(provisionalKey("Sandalmysore Core"));
    expect(provisionalKey("Ámbar gris (tintura)")).toBe("prov:ambar gris (tintura)");
    expect(provisionalKey("Sandalmysore")).not.toBe(provisionalKey("Sandalmysore Core"));
  });

  it("adds up with itself when one formula goes into another", () => {
    const accord: Formula = {
      header,
      history: [{ kind: "add", id: "a", material: provisional("Sandalmysore Core"), massUg: 1_000n, fraction: Ratio.ONE, diluent: null }],
    };
    const accordAsMaterial: Material = { key: vectorOf(accord).id, kind: "formula", name: "Acorde", vector: vectorOf(accord) };
    const perfume: Formula = {
      header,
      history: [
        { kind: "add", id: "p", material: provisional("sandalmysore core"), massUg: 2_000n, fraction: Ratio.ONE, diluent: null },
        { kind: "add", id: "q", material: accordAsMaterial, massUg: 1_000n, fraction: Ratio.ONE, diluent: null },
      ],
    };
    const parts = compose(perfume).parts;
    expect(parts).toHaveLength(1);
    expect(parts[0].massUg.eq(Ratio.of(3_000))).toBe(true);
  });
});
