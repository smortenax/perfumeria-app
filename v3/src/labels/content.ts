import type { Dilution } from "../db/catalog";
import { nominalPercent, shortName } from "../dilution/grid";
import { labelCode } from "./code";

/** What a material lends a label. */
export interface LabelMaterial {
  readonly name: string;
  readonly abbreviation: string | null;
  readonly cas: string | null;
}

/** One label, before it is drawn: its QR code and its three lines (V3-105). */
export interface LabelContent {
  readonly code: string;
  /** The material, by the name you call it («Bergamot», not «Bergamot (FCF)»). */
  readonly title: string;
  /** «10 % in DPG», «2 % in Ethanol + DPG», «Pure». */
  readonly strength: string;
  /** «CAS 8007-75-8 · 2026-11-18»; what is unknown is left out, never guessed. */
  readonly footer: string;
  /** Apart, for the spreadsheet: «8007-75-8» and «2026-11-18», or «» when unknown. */
  readonly cas: string;
  readonly date: string;
}

/** The label of one bottle of yours: material, its strength and diluents, CAS and the day it was made. */
export function dilutionLabel(
  materialOf: (id: string) => LabelMaterial | undefined,
  materialId: string,
  d: Dilution,
): LabelContent {
  const material = materialOf(materialId);
  const diluents = d.diluents.length > 0 ? d.diluents.map((x) => shortName(materialOf(x.diluentId))).join(" + ") : (d.solvent?.trim() ?? "");
  const pct = nominalPercent(d.fraction, d.label);
  const pure = diluents === "" && d.fraction.num === d.fraction.den;
  return {
    code: labelCode("dilution", d.id),
    title: material ? shortName(material) : "—",
    strength: pure ? "Pure" : diluents ? `${pct} in ${diluents}` : pct,
    footer: [material?.cas ? `CAS ${material.cas}` : null, d.madeOn].filter((x): x is string => !!x).join(" · "),
    cas: material?.cas ?? "",
    date: d.madeOn ?? "",
  };
}

/** The sheet for the Marklife app's Excel import: a header row, then one row per label (V3-105). */
export const SHEET_HEADER = ["Material", "Strength", "CAS", "Date", "Code"] as const;
export function labelSheet(labels: readonly LabelContent[]): string[][] {
  return [[...SHEET_HEADER], ...labels.map((l) => [l.title, l.strength, l.cas, l.date, l.code])];
}
