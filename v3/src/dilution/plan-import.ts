import { Ratio } from "../core/arith/ratio";
import type { Catalog, CatalogMaterial as Material } from "../db/catalog";
import { factoryBottleOf } from "../db/factory";
import { fold } from "../db/search";
import { parseCsv } from "../lib/csv";
import { percentToFraction } from "../format/percent";
import { gramsToMgText } from "../format/mass";
import type { WeighRow } from "./weigh";

/**
 * «Import planned dilutions» (the user's inbox, 2026-11-25: dilute the Perfumiarz order of 19-nov in
 * batches straight from the app). A table planned outside the app, one row per bottle to make, becomes
 * rows of «Add & weigh», grouped by bottle size, with the % and the grams wanted already written. The
 * scale's grey figures then come from the app's own exact arithmetic (weigh.ts), not from the file:
 * the file's grams are kept only to compare.
 *
 * The columns (the lab's table): material, fraction_pct, from_pct, bottle_ml, batch_g, material_g,
 * diluent, diluent_g, typical_use_pct, typical_use_source, ifra_cat4, note; and, if something was
 * already weighed, material_weighed_g, diluent_weighed_g, tare_g, full_g (empty where not yet). «from_pct» under 100 means
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
  /** The diluent the factory bottle comes in (from_pct under 100), if the sheet says it: «IPM», «DPG». */
  readonly fromDiluent: string;
  readonly diluentG: string;
  readonly typicalUsePct: string;
  readonly typicalUseSource: string;
  readonly ifraCat4: string;
  readonly note: string;
  /** What was already weighed, if the sheet says it (optional columns): the material (or its bottle), the diluent, the empty and the full bottle, in grams. */
  readonly materialWeighedG: string;
  readonly diluentWeighedG: string;
  readonly tareG: string;
  readonly fullG: string;
}

/**
 * The optional columns of what was already weighed (the user, 2026-11-25: «agregar automaticamente lo
 * que ya se ha pesado o hacerlo mixto»): a row with them comes in weighed, or half weighed.
 */
export const WEIGHED_COLUMNS = ["material_weighed_g", "diluent_weighed_g", "tare_g", "full_g"] as const;

export type ReadPlan = { readonly ok: true; readonly rows: readonly PlannedDilution[] } | { readonly ok: false; readonly missing: readonly string[] };

/** The decimal comma of a European sheet, as a point; spaces and a trailing «%» out («0,5 %» → «0.5»). */
const num = (x: string | undefined) => (x ?? "").trim().replace(",", ".").replace(/\s*%$/, "");

/** A bottle as a sheet writes it: «20 ml», «20ml», «20» → «20». */
const ml = (x: string | undefined) => num(x).replace(/\s*ml$/i, "");

/**
 * The lab's own sheet writes its headers in Spanish (diluciones-25-nov.xlsx: «Material», «Frasco»,
 * «Diluyente», «% del material de partida», «% objetivo», «Total objetivo (g)», «Material a pesar (g)»,
 * «Material real (g)», «Diluyente a añadir (g)», «Diluyente real (g)», «Notas»). Each is read as its
 * column; a header is compared without case, accents or spaces.
 */
const HEADER_ALIASES: Record<string, string> = {
  material: "material",
  "% objetivo": "fraction_pct",
  "% final": "fraction_pct",
  "% del material de partida": "from_pct",
  "% de partida": "from_pct",
  frasco: "bottle_ml",
  "frasco (ml)": "bottle_ml",
  "total objetivo (g)": "batch_g",
  "material a pesar (g)": "material_g",
  diluyente: "diluent",
  "diluyente de fabrica": "from_diluent",
  "diluyente de partida": "from_diluent",
  "diluyente del material de partida": "from_diluent",
  "diluyente a anadir (g)": "diluent_g",
  "material real (g)": "material_weighed_g",
  "diluyente real (g)": "diluent_weighed_g",
  "tara (g)": "tare_g",
  tara: "tare_g",
  "lleno (g)": "full_g",
  "peso lleno (g)": "full_g",
  notas: "note",
  nota: "note",
};
const headerKey = (h: string): string => {
  const clean = h.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  return HEADER_ALIASES[clean] ?? clean;
};

/**
 * Reads the file (CSV with commas, or tabs as pasted from a sheet, or the rows of an .xlsx). The header
 * is the first row with the column «material»: the title and instructions a sheet has above it are
 * skipped, and the table ends at its first blank row (below it, a sheet has its totals and notes).
 */
export function readDilutionPlan(text: string): ReadPlan {
  return readDilutionRows(gridOf(text));
}

/** The same, from rows already split into cells (an .xlsx, lib/xlsx.ts). */
export function readDilutionRows(grid: readonly (readonly string[])[]): ReadPlan {
  const at = grid.findIndex((row) => row.some((c) => headerKey(c) === "material"));
  if (at < 0) return { ok: false, missing: [...REQUIRED] };
  const header = grid[at].map(headerKey);
  const missing = REQUIRED.filter((c) => !header.includes(c));
  if (missing.length > 0) return { ok: false, missing };
  const body = grid.slice(at + 1);
  const blank = body.findIndex((row) => row.every((c) => c.trim() === ""));
  const rows = (blank < 0 ? body : body.slice(0, blank)).map((cells, i) => {
    const get = (k: string) => {
      const col = header.indexOf(k);
      return col < 0 ? "" : (cells[col] ?? "").trim();
    };
    return {
      line: at + i + 2,
      material: get("material"),
      fractionPct: num(get("fraction_pct")),
      fromPct: num(get("from_pct")),
      bottleMl: ml(get("bottle_ml")),
      batchG: num(get("batch_g")),
      materialG: num(get("material_g")),
      diluent: get("diluent"),
      fromDiluent: get("from_diluent"),
      diluentG: num(get("diluent_g")),
      typicalUsePct: num(get("typical_use_pct")),
      typicalUseSource: get("typical_use_source"),
      ifraCat4: num(get("ifra_cat4")),
      note: get("note"),
      materialWeighedG: num(get("material_weighed_g")),
      diluentWeighedG: num(get("diluent_weighed_g")),
      tareG: num(get("tare_g")),
      fullG: num(get("full_g")),
    };
  });
  return { ok: true, rows: rows.filter((r) => r.material !== "") };
}

/** Text as rows of cells: by tabs when its lines have tabs and no commas (pasted from a sheet), else CSV. */
function gridOf(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/);
  const tabbed = lines.some((l) => l.includes("\t"));
  return tabbed ? lines.map((l) => l.split("\t")) : parseCsv(clean);
}

/** What a row still needs before it can be weighed. */
export type PlanProblem = "material" | "materialTwice" | "diluent" | "source" | "sourceDiluent" | "fromDiluent" | "percent" | "further";

export interface PlanMatch {
  readonly planned: PlannedDilution;
  /** Your material it found; null when none or more than one. */
  readonly materialId: string | null;
  /** The materials with that name, when there are two or more. */
  readonly candidates: readonly string[];
  /** How it was found: the same name, or a similar one (without maker or strength) to check. */
  readonly by: "name" | "similar" | null;
  readonly diluentId: string | null;
  /** The factory bottle it is weighed from (from_pct under 100), or null for pure. */
  readonly sourceId: string | null;
  /** The diluent of the factory bottle the sheet names (from_diluent), found among the diluents. */
  readonly fromDiluentId: string | null;
  /**
   * A factory bottle of the material, when the sheet says pure (from_pct empty or 100): it does not stop
   * the row (you may have the pure too), but says so, because weighing from the bottle as if it were pure
   * would save ten times the material and lose its diluent.
   */
  readonly factoryHint: string | null;
  readonly problems: readonly PlanProblem[];
}

const keysOf = (m: Material) => [m.name, m.product ?? "", m.abbreviation ?? "", ...m.aliases].map(fold).filter((k) => k !== "");

/** A diluent also by its name without what is in brackets: «DPG (dipropylene glycol)» is «DPG». */
const solventKeys = (m: Material) => [...keysOf(m), fold(m.name.replace(/\s*\(.*\)\s*$/, ""))].filter((k) => k !== "");

/**
 * A name without its maker or its strength, as shops and sheets add them: «Wool Absolute (Biolandes)»,
 * «Hydroxyambran 50% (IPM)», «Meta Cresol 10 % (DPG)», «Ambroxan® (powder)» → «woolabsolute»,
 * «hidroxiambran», «metacresol», «ambroxan».
 */
export const bareName = (name: string): string => fold(name.replace(/\s*\([^)]*\)\s*$/, "").replace(/\s*\d+([.,]\d+)?\s*%\s*$/, ""));

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
  const byBare = indexBy(mine, (m) => [bareName(m.name), ...(m.product ? [bareName(m.product)] : [])].filter((k) => k !== ""));
  const bySolvent = indexBy(solvents, solventKeys);
  return rows.map((planned) => {
    const problems: PlanProblem[] = [];
    const from = planned.fromPct ? fractionOf(planned.fromPct) : Ratio.ONE;
    const exact = byName.get(fold(planned.material)) ?? [];
    // Not by its name: by the name without maker or strength, then a longer name of yours that starts
    // with it («Thujopsene» → «Thujopsene natural»); among several, the one with its factory bottle.
    const bare = bareName(planned.material);
    let similar = exact.length ? [] : (byBare.get(bare) ?? []);
    if (!exact.length && !similar.length && bare.length >= 5) similar = mine.filter((m) => bareName(m.name).startsWith(bare)).map((m) => m.id);
    if (similar.length > 1 && from && from.cmp(Ratio.ONE) < 0) {
      const withBottle = similar.filter((id) => sourceFor(catalog, id, from));
      if (withBottle.length > 0) similar = withBottle;
    }
    const found = [...new Set(exact.length ? exact : similar)];
    const materialId = found.length === 1 ? found[0] : null;
    const by = materialId ? (exact.length ? "name" : "similar") : null;
    if (found.length === 0) problems.push("material");
    if (found.length > 1) problems.push("materialTwice");
    const diluentId = solventOf(bySolvent, planned.diluent);
    if (!diluentId) problems.push("diluent");
    const fromDiluentId = planned.fromDiluent ? solventOf(bySolvent, planned.fromDiluent) : null;
    const target = fractionOf(planned.fractionPct);
    if (!target || target.cmp(Ratio.ONE) >= 0 || !from) problems.push("percent");
    else if (target.cmp(from) >= 0) problems.push("further");
    const source = sourceOf(catalog, planned, materialId, from, fromDiluentId);
    return { planned, materialId, candidates: found.length > 1 ? found : [], by, diluentId, ...source, problems: [...problems, ...source.problems] };
  });
}

/** A diluent by its name or another of its names; «Alcohol 96º», «Ethanol 96 %»: also without its strength. */
function solventOf(bySolvent: ReadonlyMap<string, string[]>, name: string): string | null {
  return (bySolvent.get(fold(name)) ?? bySolvent.get(fold(name.replace(/\s*\d+([.,]\d+)?\s*(º|°|%)?\s*$/, ""))))?.[0] ?? null;
}

/**
 * The bottle a row is weighed from, and what is wrong with it. From under 100 %: your bottle at that
 * exact %, and in the factory diluent the sheet names, if it names one. Pure: none, but a factory
 * bottle of the material is pointed out (factoryHint).
 */
function sourceOf(catalog: Catalog, planned: PlannedDilution, materialId: string | null, from: Ratio | null, fromDiluentId: string | null) {
  const problems: PlanProblem[] = [];
  if (planned.fromDiluent && !fromDiluentId) problems.push("fromDiluent");
  if (!materialId || !from) return { sourceId: null, fromDiluentId, factoryHint: null, problems };
  if (from.cmp(Ratio.ONE) >= 0) return { sourceId: null, fromDiluentId, factoryHint: factoryBottleOf(catalog, materialId)?.id ?? null, problems };
  const sourceId = sourceFor(catalog, materialId, from, fromDiluentId);
  if (!sourceId) problems.push(fromDiluentId && sourceFor(catalog, materialId, from) ? "sourceDiluent" : "source");
  return { sourceId, fromDiluentId, factoryHint: null, problems };
}

/** The material's own bottle at exactly that %, not archived, that says its diluents (the newest); in that diluent, if given. */
export function sourceFor(catalog: Catalog, materialId: string, from: Ratio, diluentId: string | null = null): string | null {
  const bottles = (catalog.dilutions.get(materialId) ?? []).filter(
    (d) => !d.archivedAt && d.diluents.length > 0 && d.fraction.cmp(from) === 0 && (!diluentId || d.diluents.some((x) => x.diluentId === diluentId)),
  );
  return [...bottles].sort((a, b) => (b.madeOn ?? "").localeCompare(a.madeOn ?? ""))[0]?.id ?? null;
}


/** A row's match once you have picked what was missing (the material, the diluent). */
export function withChoice(catalog: Catalog, match: PlanMatch, choice: { readonly materialId?: string; readonly diluentId?: string }): PlanMatch {
  const materialId = choice.materialId ?? match.materialId;
  const diluentId = choice.diluentId ?? match.diluentId;
  const from = match.planned.fromPct ? fractionOf(match.planned.fromPct) : Ratio.ONE;
  const problems: PlanProblem[] = match.problems.filter((p) => p === "percent" || p === "further");
  if (!materialId) problems.push(match.candidates.length > 1 ? "materialTwice" : "material");
  if (!diluentId) problems.push("diluent");
  const source = sourceOf(catalog, match.planned, materialId, from, match.fromDiluentId);
  const by = choice.materialId ? "name" : match.by;
  return { ...match, materialId, by, diluentId, ...source, problems: [...problems, ...source.problems] };
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
      total: gramsToMgText(m.planned.batchG),
      weighed: gramsToMgText(m.planned.materialWeighedG),
      diluents: [{ diluentId: m.diluentId!, share: "", weighed: gramsToMgText(m.planned.diluentWeighedG) }],
      note: m.planned.note,
      bottleMl: m.planned.bottleMl || undefined,
      tare: gramsToMgText(m.planned.tareG),
      gross: gramsToMgText(m.planned.fullG),
      plan: {
        materialG: gramsToMgText(m.planned.materialG),
        diluentG: gramsToMgText(m.planned.diluentG),
        typicalUsePct: m.planned.typicalUsePct,
        ifraCat4: m.planned.ifraCat4,
      },
    }));
}
