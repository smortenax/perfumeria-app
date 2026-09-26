import { Ratio } from "../arith/ratio";
import type { IfraData, IfraMaterial, IfraSubstance } from "../ifra";
import { F001_LINES, f001Material } from "./f001";

/**
 * IFRA data for the materials of F-001, taken by hand from the lab's ifra-cat4.csv
 * (commit 9949c5f; 51st amendment, category 4, % of the finished product). Its
 * figures match IFRA's overview (docs/investigacion/2026-09-26-archivos-ifra-51/).
 * It only feeds the tests of the core: the app reads datos/glosario/ (P37).
 */
const pct = (text: string) => Ratio.fromDecimal(text).div(Ratio.of(100));

const own = (labId: string, name: string, limit: string): IfraSubstance => ({
  key: `lab:${labId}`,
  name,
  limit: pct(limit),
  amendment: "51",
});

export const COUMARIN: IfraSubstance = { key: "sub:cumarina", name: "Cumarina", limit: pct("1,5"), amendment: "51" };

const SUBSTANCES: IfraSubstance[] = [
  own("MAT-iso-e-super", "Iso E Super", "20"),
  own("MAT-cashmeran", "Cashmeran", "3,8"),
  own("MAT-polysantol", "Polysantol", "1,1"),
  own("MAT-mayol", "Mayol", "4,7"),
  own("MAT-resinoide-estyrax-estoraque", "Resinoide estírax", "0,64"),
  COUMARIN,
];

const regulatedAsItself = (labId: string, conditions: string[] = []): IfraMaterial => ({
  status: "checked",
  substances: [{ key: `lab:${labId}`, fraction: Ratio.ONE }],
  conditions,
});

const SPECIAL: Record<string, IfraMaterial> = {
  "MAT-iso-e-super": regulatedAsItself("MAT-iso-e-super"),
  "MAT-cashmeran": regulatedAsItself("MAT-cashmeran"),
  "MAT-polysantol": regulatedAsItself("MAT-polysantol"),
  "MAT-mayol": regulatedAsItself("MAT-mayol"),
  "MAT-resinoide-estyrax-estoraque": regulatedAsItself("MAT-resinoide-estyrax-estoraque", [
    "HAP ≤ 1 ppb, con certificado del proveedor",
  ]),
  "MAT-lavanda": { status: "checked", substances: [], conditions: ["Linalol: especificación del STD 187"] },
  // "no evaluable": carries coumarin with an undeclared load.
  "MAT-haba-tonka-tintura": { status: "checked", substances: [{ key: COUMARIN.key, fraction: null }], conditions: [] },
  // "sin verificar": its CAS was never looked up in the index.
  "MAT-ambar-gris-tintura": { status: "unchecked", substances: [], conditions: [] },
};

export function f001Ifra(): IfraData {
  const materials = new Map<string, IfraMaterial>();
  for (const [name, labId] of F001_LINES) {
    if (labId === "alcohol") {
      continue;
    }
    // Everything else is "sin estándar propio": looked up, with no standard of its own.
    materials.set(f001Material(labId, name).key, SPECIAL[labId] ?? { status: "checked", substances: [], conditions: [] });
  }
  return { substances: new Map(SUBSTANCES.map((s) => [s.key, s])), materials };
}
