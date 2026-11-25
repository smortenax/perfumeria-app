import { Ratio } from "../core/arith/ratio";
import type { Catalog, CatalogMaterial as Material } from "../db/catalog";
import { fold } from "../db/search";
import { parseCsvRecords } from "../lib/csv";
import { percentToFraction } from "../format/percent";
import type { WeighRow } from "./weigh";

/**
 * «Import planned dilutions» (the user's inbox, 2026-11-25: dilute the Perfumiarz order of 19-nov in
 * batches straight from the app). A table planned outside the app, one row per bottle to make, becomes
 * rows of «Add & weigh», grouped by bottle size, with the % and the grams wanted already written. The
 * scale's grey figures then come from the app's own exact arithmetic (weigh.ts), not from the file:
 * the file's grams are kept only to compare.
 *
 * The columns (the lab's table): material, fraction_pct, from_pct, bottle_ml, batch_g, material_g,
 * diluent, diluent_g, typical_use_pct, typical_use_source, ifra_cat4, note. «from_pct» under 100 means
 * the material is weighed from a factory dilution of yours (V3-67), at that %.
 *
 * Nothing is guessed: a material is found by its name, its shop product name or another name of yours;
 * a diluent, by its name, short name or another name; a source bottle, by its exact %. What is not
 * found says so, and that row is not added until you pick it.
 */

/** The columns the file must have; the rest are optional. */
export const REQUIRED = ["material", "fraction_pct", "diluent"] as const;

/** One row of the file, as written. */
export interface PlannedDilution {
  /** Its line in the file (the header is line 1). */
  readonly line: number;
  readonly material: string;
  readonly fractionPct: string;
  readonly fromPct: string;
  readonly bottleMl: string;
  readonly batchG: string;
  readonly materialG: string;
  readonly diluent: string;
  readonly diluentG: string;
  readonly typicalUsePct: string;
  readonly typicalUseSource: string;
  readonly ifraCat4: string;
  readonly note: string;
}

export type ReadPlan = { readonly ok: true; readonly rows: readonly PlannedDilution[] } | { readonly ok: false; readonly missing: readonly string[] };

/** The decimal comma of a European sheet, as a point; spaces out. */
const num = (x: string | undefined) => (x ?? "").trim().replace(",", ".");

/** Reads the file (CSV with commas, or tabs as pasted from a sheet). */
export function readDilutionPlan(text: string): ReadPlan {
  const clean = text.replace(/^﻿/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const tabbed = firstLine.includes("\t") && !firstLine.includes(",");
  const records = tabbed ? tabRecords(clean) : parseCsvRecords(clean);
  const header = tabbed ? firstLine.split("\t").map((h) => h.trim()) : Object.keys(records[0] ?? {}).map((h) => h.trim());
  const missing = REQUIRED.filter((c) => !header.includes(c));
  if (records.length === 0 && header.length <= 1) return { ok: false, missing: [...REQUIRED] };
  if (missing.length > 0) return { ok: false, missing };
  const rows = records.map((r, i) => {
    const get = (k: string) => (r[k] ?? r[` ${k}`] ?? "").trim();
    return {
      line: i + 2,
      material: get("material"),
      fractionPct: num(get("fraction_pct")),
      fromPct: num(get("from_pct")),
      bottleMl: num(get("bottle_ml")),
      batchG: num(get("batch_g")),
      materialG: num(get("material_g")),
      diluent: get("diluent"),
      diluentG: num(get("diluent_g")),
      typicalUsePct: num(get("typical_use_pct")),
      typicalUseSource: get("typical_use_source"),
      ifraCat4: num(get("ifra_cat4")),
      note: get("note"),
    };
  });
  return { ok: true, rows: rows.filter((r) => r.material !== "") };
}

function tabRecords(text: string): Record<string, string>[] {
  const [head = "", ...lines] = text.split(/\r?\n/);
  const names = head.split("\t").map((h) => h.trim());
  return lines.filter((l) => l.trim()).map((l) => Object.fromEntries(l.split("\t").map((v, i) => [names[i] ?? `c${i}`, v])));
}

/** What a row still needs before it can be weighed. */
export type PlanProblem = "material" | "materialTwice" | "diluent" | "source" | "percent" | "further";

export interface PlanMatch {
  readonly planned: PlannedDilution;
  /** Your material it found; null when none or more than one. */
  readonly materialId: string | null;
  /** The materials with that name, when there are two or more. */
  readonly candidates: readonly string[];
  readonly diluentId: string | null;
  /** The factory bottle it is weighed from (from_pct under 100), or null for pure. */
  readonly sourceId: string | null;
  readonly problems: readonly PlanProblem[];
}

const keysOf = (m: Material) => [m.name, m.product ?? "", m.abbreviation ?? "", ...m.aliases].map(fold).filter((k) => k !== "");

/** A diluent also by its name without what is in brackets: «DPG (dipropylene glycol)» is «DPG». */
const solventKeys = (m: Material) => [...keysOf(m), fold(m.name.replace(/\s*\(.*\)\s*$/, ""))].filter((k) => k !== "");

function indexBy(materials: readonly Material[], keys = keysOf): Map<string, string[]> {
  const by = new Map<string, string[]>();
  for (const m of materials)
    for (const k of new Set(keys(m))) {
      const list = by.get(k) ?? [];
      list.push(m.id);
      by.set(k, list);
    }
  return by;
}

/** The pure % as a fraction (0 < x < 1 for the bottle, up to 1 for «from»), or null. */
const fractionOf = (pct: string): Ratio | null => {
  const f = percentToFraction(pct);
  return f && f.sign() > 0 && f.cmp(Ratio.ONE) <= 0 ? f : null;
};

/**
 * Each row against your materials: the material among yours (not the diluents), the diluent among all
 * the diluents (common first), the source bottle among the material's own that say their diluents.
 */
export function matchDilutionPlan(rows: readonly PlannedDilution[], catalog: Catalog, userId: string | null = null): PlanMatch[] {
  const all = [...catalog.materials.values()];
  const mine = all.filter((m) => m.ownerId !== null && (userId === null || m.ownerId === userId) && !m.solvent);
  const solvents = all.filter((m) => m.solvent).sort((a, b) => (a.ownerId ? 1 : 0) - (b.ownerId ? 1 : 0));
  const byName = indexBy(mine);
  const bySolvent = indexBy(solvents, solventKeys);
  return rows.map((planned) => {
    const problems: PlanProblem[] = [];
    const found = byName.get(fold(planned.material)) ?? [];
    const materialId = found.length === 1 ? found[0] : null;
    if (found.length === 0) problems.push("material");
    if (found.length > 1) problems.push("materialTwice");
    const diluentId = bySolvent.get(fold(planned.diluent))?.[0] ?? null;
    if (!diluentId) problems.push("diluent");
    const target = fractionOf(planned.fractionPct);
    const from = planned.fromPct ? fractionOf(planned.fromPct) : Ratio.ONE;
    if (!target || target.cmp(Ratio.ONE) >= 0 || !from) problems.push("percent");
    else if (target.cmp(from) >= 0) problems.push("further");
    const sourceId = materialId && from && from.cmp(Ratio.ONE) < 0 ? sourceFor(catalog, materialId, from) : null;
    if (materialId && from && from.cmp(Ratio.ONE) < 0 && !sourceId) problems.push("source");
    return { planned, materialId, candidates: found.length > 1 ? found : [], diluentId, sourceId, problems };
  });
}

/** The material's own bottle at exactly that %, not archived, that says its diluents (the newest). */
export function sourceFor(catalog: Catalog, materialId: string, from: Ratio): string | null {
  const bottles = (catalog.dilutions.get(materialId) ?? []).filter((d) => !d.archivedAt && d.diluents.length > 0 && d.fraction.cmp(from) === 0);
  return [...bottles].sort((a, b) => (b.madeOn ?? "").localeCompare(a.madeOn ?? ""))[0]?.id ?? null;
}

/** A row's match once you have picked what was missing (the material, the diluent). */
export function withChoice(catalog: Catalog, match: PlanMatch, choice: { readonly materialId?: string; readonly diluentId?: string }): PlanMatch {
  const materialId = choice.materialId ?? match.materialId;
  const diluentId = choice.diluentId ?? match.diluentId;
  const from = match.planned.fromPct ? fractionOf(match.planned.fromPct) : Ratio.ONE;
  const needsSource = !!from && from.cmp(Ratio.ONE) < 0;
  const sourceId = materialId && needsSource ? sourceFor(catalog, materialId, from!) : null;
  const problems: PlanProblem[] = match.problems.filter((p) => p === "percent" || p === "further");
  if (!materialId) problems.push(match.candidates.length > 1 ? "materialTwice" : "material");
  if (!diluentId) problems.push("diluent");
  if (materialId && needsSource && !sourceId) problems.push("source");
  return { ...match, materialId, diluentId, sourceId, problems };
}

/** The rows ready to weigh, as «Add & weigh» takes them: by bottle size, then as in the file. */
export function weighRowsOf(matches: readonly PlanMatch[], key: () => string): WeighRow[] {
  // The bottle's size only orders the groups: read as a decimal, like a %, and compared.
  const ml = (m: PlanMatch) => percentToFraction(m.planned.bottleMl);
  return matches
    .filter((m) => m.problems.length === 0 && m.materialId && m.diluentId)
    .map((m, i) => ({ m, i, size: ml(m) }))
    .sort((a, b) => (a.size && b.size ? a.size.cmp(b.size) : a.size ? -1 : b.size ? 1 : 0) || a.i - b.i)
    .map(({ m }) => ({
      key: key(),
      materialId: m.materialId!,
      sourceId: m.sourceId,
      target: m.planned.fractionPct,
      total: m.planned.batchG,
      weighed: "",
      diluents: [{ diluentId: m.diluentId!, share: "", weighed: "" }],
      note: m.planned.note,
      bottleMl: m.planned.bottleMl || undefined,
      tare: "",
      gross: "",
      plan: {
        materialG: m.planned.materialG,
        diluentG: m.planned.diluentG,
        typicalUsePct: m.planned.typicalUsePct,
        ifraCat4: m.planned.ifraCat4,
      },
    }));
}
