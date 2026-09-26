import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { formatPercent } from "../core/display";
import { f001 } from "../core/fixtures/f001";
import { checkIfra } from "../core/ifra";
import { searchCatalog } from "./catalog";
import { catalog } from "./provisional";

const material = (id: string) => catalog.ifra.materials.get(`lab:${id}`);

describe("the provisional catalog, from datos/fuente/", () => {
  it("has the 54 materials of the lab as the user's own, the two diluents and the 3119 rows of the FIG", () => {
    const count = (group: string) => catalog.entries.filter((e) => e.group === group).length;
    expect(count("own")).toBe(54);
    expect(count("diluent")).toBe(2);
    expect(count("base")).toBe(3119);
    expect(catalog.source.commit).toBe("9949c5f");
  });

  it("gives F-001 the same IFRA answer as the fixture checked by hand against the notebook", () => {
    const report = checkIfra(f001(), catalog.ifra);
    const check = (key: string) => report.checks.find((c) => c.substance.key === key);
    expect(check("lab:MAT-polysantol")?.verdict).toBe("within");
    expect(formatPercent(check("lab:MAT-polysantol")?.knownUg.div(report.finalUg) ?? Ratio.ZERO)).toBe("0,271 %");
    for (const id of ["MAT-iso-e-super", "MAT-cashmeran", "MAT-mayol", "MAT-resinoide-estyrax-estoraque"]) {
      expect(check(`lab:${id}`)?.verdict, id).toBe("within");
    }
    const coumarin = check("sub:cumarina");
    expect(coumarin?.verdict).toBe("bounded");
    expect(formatPercent(coumarin?.worstUg.div(report.finalUg) ?? Ratio.ZERO)).toBe("0,188 %");
    expect(report.unchecked).toEqual(["Ámbar gris (tintura)"]);
    expect([...new Set(report.conditions.map((c) => c.material))]).toEqual(["Lavanda", "Resinoide Estírax"]);
    expect(report.pending).toEqual([]);
    expect(report.asIs).toBe("unknown");
  });

  it("shares coumarin between the bottle and the tonka tincture", () => {
    expect(material("MAT-cumarina-natural")?.substances).toEqual([{ key: "sub:cumarina", fraction: Ratio.ONE }]);
    expect(material("MAT-haba-tonka-tintura")?.substances).toEqual([{ key: "sub:cumarina", fraction: null }]);
    expect(catalog.ifra.substances.get("sub:cumarina")?.limit.eq(Ratio.of(15, 1000))).toBe(true);
  });

  it("keeps a ceiling that is not in the data as pending, never free", () => {
    expect(material("MAT-limon")?.substances).toEqual([{ key: "lab:MAT-limon", fraction: Ratio.ONE }]);
    expect(material("MAT-limon")?.pending).toHaveLength(1);
    expect(material("MAT-limon")?.pending?.[0]).toMatch(/^citral/);
    expect(material("MAT-salvia-officinalis")?.pending?.[0]).toMatch(/^tuyona/);
    expect(material("MAT-litsea-cubeba")?.pending?.[0]).toMatch(/^citral/);
  });

  it("takes the strictest of two ceilings, and says why", () => {
    const aldehyde = material("MAT-aldehido-alfa-amil-cinamico");
    expect(catalog.ifra.substances.get("lab:MAT-aldehido-alfa-amil-cinamico")?.limit.eq(Ratio.of(7, 100))).toBe(true);
    expect(aldehyde?.conditions[0]).toMatch(/dos techos/);
  });

  it("lists as unchecked what was never looked up, and what has nothing known inside", () => {
    expect(material("MAT-ambar-gris-tintura")?.status).toBe("unchecked");
    expect(material("MAT-esencia-de-trufa")?.status).toBe("unchecked");
    // The FIG base has no IFRA by CAS yet (§5.2): it is not in the data, so it is unchecked.
    expect(catalog.ifra.materials.has("fig:1")).toBe(false);
  });

  it("finds the user's own materials first, with or without accents", () => {
    expect(searchCatalog(catalog.entries, "iso e")[0].material.key).toBe("lab:MAT-iso-e-super");
    expect(searchCatalog(catalog.entries, "estirax")[0].material.key).toBe("lab:MAT-resinoide-estyrax-estoraque");
    expect(searchCatalog(catalog.entries, "24851-98-7")[0].material.key).toBe("lab:MAT-hedione");
    expect(searchCatalog(catalog.entries, "dpg")[0].material.key).toBe("solv:dpg");
  });
});
