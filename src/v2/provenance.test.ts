import { describe, expect, it } from "vitest";
import { repositoryFor } from "../data/repositories";
import { v2Dataset } from "./data";
import { provenanceOf } from "./provenance";

const data = v2Dataset();
const repository = repositoryFor("v2");
const idOf = (name: string) => data.products.find((p) => p.name === name)!.id;
const provenance = (name: string) => repository.get(`v2:${idOf(name)}`)!.provenance!;

describe("where each figure comes from (the card of a v2 material)", () => {
  it("the pepper: figures of the product as it is bought, each with the certificate that gives it", () => {
    const p = provenance("Black Pepper Absolute");
    expect(p.figures.map((f) => [f.component, f.value, f.authority, f.placeholder, f.base, f.from])).toEqual([
      ["Benzaldehyde", "0.0001 %", "producto", false, "producto", "producto"],
      ["Eugenol", "0.0045 %", "producto", false, "producto", "producto"],
    ]);
    expect(p.figures.every((f) => f.document?.title === "IFRA certificate — PEPPER BLACK ABS PG 974644 (974644)" && f.document.reviewed)).toBe(true);
    // The certificate lists every restricted substance; the material itself has no document of its own.
    expect(p.coverages.map((c) => [c.from, c.coverage]).sort()).toEqual([
      ["material", "desconocida"],
      ["producto", "reguladas-completa"],
    ]);
    expect(p.ceilings).toEqual([]);
  });

  it("the manufacturer's ceiling is the product's, with its maker and its document (D4)", () => {
    const [ceiling] = provenance("Black Agar 296985").ceilings;
    expect(ceiling).toMatchObject({ category: "4", maxPct: "9.6296", maker: "Firmenich" });
    expect(ceiling.document?.title).toContain("BLACK AGAR 296985");
  });

  it("a figure of another supplier's document is a placeholder, and says so (D2, D9)", () => {
    const placeholders = provenance("Resinoide de benjuí").figures.filter((f) => f.placeholder);
    expect(placeholders.length).toBeGreaterThan(0);
    expect(placeholders.every((f) => f.authority === "literatura" && f.document !== null)).toBe(true);
  });

  it("the conditions say their state and what proves them (D11)", () => {
    const cade = provenance("Aceite de cade (enebro)").conditions.find((c) => c.state === "supuesta")!;
    expect(cade).toMatchObject({ authority: "consenso", standard: "IFRA_STD_119" });
    const oakmoss = provenance("Oakmoss Absolute 50% (IPM)").conditions.find((c) => c.state === "probada")!;
    expect(oakmoss).toMatchObject({ authority: "producto", standard: "IFRA_STD_067" });
    expect(oakmoss.document?.title).toContain("MOUSSE CHENE");
    const linalool = provenance("Linalol").conditions.find((c) => c.standard === "IFRA_STD_187");
    expect(linalool?.state).toBe("pendiente");
  });

  it("every figure of a product or a lot has its document, and every document is reviewed (D6)", () => {
    for (const p of data.products) {
      const card = provenanceOf(data, p.id);
      for (const f of card.figures.filter((x) => x.from !== "material")) {
        expect(f.document, `${p.name}: ${f.component}`).not.toBeNull();
      }
      expect(card.figures.every((f) => f.document === null || f.document.reviewed), p.name).toBe(true);
    }
  });
});
