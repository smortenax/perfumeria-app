import type { Dilution } from "../db/catalog";
import { decimal } from "../format/numbers";
import { Ratio } from "../core/arith/ratio";
import { shortName } from "../dilution/grid";
import { gramsText } from "../format/mass";
import { labelCode } from "./code";

/** What a material lends a label. */
export interface LabelMaterial {
  readonly name: string;
  readonly abbreviation: string | null;
  readonly cas: string | null;
}

/** One label, before it is drawn: its QR code and its three lines (V3-110). */
export interface LabelContent {
  readonly code: string;
  /** The material, by the name you call it («Bergamot», not «Bergamot (FCF)»). */
  readonly title: string;
  /** «10 % in DPG», «2 % in Ethanol + DPG», «Pure». */
  readonly strength: string;
  /**
   * «2026-11-25 · Full 23.456 g · Tare 12.345 g» when the bottle was weighed full, so it can be
   * reweighed; otherwise «CAS 8007-75-8 · 2026-11-18». What is unknown is left out, never guessed.
   */
  readonly footer: string;
  /** Apart: «8007-75-8» and «2026-11-18», or «» when unknown. */
  readonly cas: string;
  readonly date: string;
}

/** A bottle weighed full on the bench: the whole bottle and its empty glass, in micrograms. */
export interface BottleWeights {
  readonly fullUg: bigint;
  readonly tareUg: bigint | null;
}

/**
 * The label of one bottle of yours (the lab inbox, 2026-11-25: «cada dilución pesada sale con su
 * etiqueta (`MATERIAL · % · disolvente · fecha`, peso lleno y tara)»): material, its strength and
 * diluents big; the day and, when known, the full weight and the tare small, to reweigh it later.
 * Without weights, the small line keeps the CAS.
 */
export function dilutionLabel(
  materialOf: (id: string) => LabelMaterial | undefined,
  materialId: string,
  d: Dilution,
  weights?: BottleWeights | null,
): LabelContent {
  const material = materialOf(materialId);
  const diluents = d.diluents.length > 0 ? d.diluents.map((x) => shortName(materialOf(x.diluentId))).join(" + ") : (d.solvent?.trim() ?? "");
  const pct = labelPercent(d.fraction, d.label);
  const pure = diluents === "" && d.fraction.num === d.fraction.den;
  return {
    code: labelCode("dilution", d.id),
    title: material ? shortName(material) : "—",
    strength: pure ? "Pure" : diluents ? `${pct} in ${diluents}` : pct,
    footer: (weights
      ? [d.madeOn, `Full ${gramsText(weights.fullUg)} g`, weights.tareUg !== null ? `Tare ${gramsText(weights.tareUg)} g` : null]
      : [material?.cas ? `CAS ${material.cas}` : null, d.madeOn]
    ).filter((x): x is string => !!x).join(" · "),
    cas: material?.cas ?? "",
    date: d.madeOn ?? "",
  };
}

/**
 * A bottle's strength as its label prints it (the user, 2026-11-24: «el % de impresion se hace con el
 * valor redondeado con 2 unidades de valor nominal 10%, 15%, 30%... solo decimal en el caso que sea
 * numeros muy pequeños como cuando hay 1,5% o 2.3%»): the percentage you made it at when it is close to
 * what was weighed, otherwise what was weighed; from 10 % up, a whole number («10 %», «15 %», «47 %»);
 * below, two figures («1.5 %», «2.3 %», «0.25 %»), with no trailing zero («1 %»). Never zero (§1.2).
 */
export function labelPercent(fraction: Ratio, label: string | null): string {
  const real = Number(decimal(fraction.mul(Ratio.of(100)), 6));
  const given = label?.match(/(\d+(?:[.,]\d+)?)\s*%/)?.[1];
  const typed = given === undefined ? NaN : Number(given.replace(",", "."));
  const close = real >= 1 ? Math.max(0.5, real * 0.1) : real * 0.2;
  const value = typed > 0 && Math.abs(typed - real) <= close ? typed : real;
  if (value >= 10) return `${Math.round(value)} %`;
  return `${Number(value.toPrecision(2))} %`;
}

/** A label's two lines, as the test page proved them on the P15 (2026-11-24): material and strength big, CAS and date small. */
export const linesOf = (l: LabelContent): { big: string; small: string } => ({ big: `${l.title} · ${l.strength}`, small: l.footer });
