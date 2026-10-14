import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../../src/data/csv.ts";
import type { IfraData } from "../../src/core/ifra.ts";
import { buildIfra, ifraCards, type IfraBuild, type IfraCard, type IfraFiles } from "../../src/v2/to-ifra.ts";
import type { Dataset } from "../../src/v2/model.ts";
import { type LocalDb, loadCatalog } from "../../v3/src/db/materials";
import type { Catalog } from "../../v3/src/db/catalog";
import { buildIfraLayer, type IfraLayer } from "../../v3/src/db/ifra-layer";
import * as local from "../../v3/src/db/local/schema";
import { ifraCard, toIfra, type IfraCardState } from "../../v3/src/db/to-ifra";
import { readSources, type Sources } from "../lib/fuentes.ts";
import { uuidFor } from "../lib/ids.ts";

/**
 * What the check reads, and how (plan v3, step 5.1):
 *
 * - the v2 through its own loader, validator and adapter (src/v2/), exactly as the migration reads it;
 * - the v3 from CSV files, not from a database: the common data (v3/datos/), IFRA's layer (v3/datos/ifra_*.csv)
 *   and the user's versions (migracion-v3/tandas/8-tu-version/). Their rows go through the v3's own
 *   `loadCatalog` and `buildIfraLayer`, so that a row means here what it means in the app. Numbers stay
 *   exact text until the v3 turns them into `Ratio`.
 */

export const ROOT = join(import.meta.dirname, "..", "..");
/** A fixed owner for the user's rows: the CSV leaves it empty and the loader writes the account's id. */
export const OWNER = "00000000-0000-4000-8000-00000000f5f5";

type Row = Readonly<Record<string, string>>;
const records = (path: string): Row[] => parseCsvRecords(readFileSync(join(ROOT, path), "utf8"));
const maybe = (path: string): Row[] => (existsSync(join(ROOT, path)) ? records(path) : []);

// ------------------------------------------------------------------ CSV rows as the copy keeps them

interface Column {
  readonly key: string;
  readonly name: string;
  readonly dataType: string;
}

/** The columns of a Drizzle table: the property is the camelCase key, `name` the column of the CSV. */
function columnsOf(table: object): Column[] {
  return Object.entries(table)
    .filter(([, v]) => typeof v === "object" && v !== null && "columnType" in v && "name" in v)
    .map(([key, v]) => ({ key, name: (v as { name: string }).name, dataType: (v as { dataType: string }).dataType }));
}

/** A CSV cell as the copy holds it: a list is JSON text, a boolean «true», an empty cell is null (never zero). */
function cellOf(column: Column, text: string): unknown {
  if (text === "") return null;
  switch (column.dataType) {
    case "json":
      return JSON.parse(text);
    case "boolean":
      return text === "true";
    case "number":
      return Number(text);
    default:
      return text;
  }
}

/** The rows of a CSV in the shape Drizzle's `$inferSelect` gives; a column the CSV does not have is null. */
function rowsOf(table: object, csv: readonly Row[], fix: (column: Column, value: unknown) => unknown = (_c, v) => v): Record<string, unknown>[] {
  const columns = columnsOf(table);
  const unknownColumns = csv.length > 0 ? Object.keys(csv[0]).filter((name) => !columns.some((c) => c.name === name)) : [];
  if (unknownColumns.length > 0) throw new Error(`Columns that the schema does not have: ${unknownColumns.join(", ")}`);
  return csv.map((record) => Object.fromEntries(columns.map((c) => [c.key, fix(c, cellOf(c, record[c.name] ?? ""))])));
}

/** The user's rows have no owner in the CSV: the loader gives them the account's. */
const owned = (column: Column, value: unknown) => ((column.name === "owner_id" || column.name === "user_id") && value === null ? OWNER : value);

// ------------------------------------------------------------------ the v3

export interface V3 {
  readonly catalog: Catalog;
  readonly layer: IfraLayer;
  readonly ifra: IfraData;
  readonly card: (id: string) => IfraCardState;
}

const COMMON = "v3/datos";
const MINE = "migracion-v3/tandas/8-tu-version";

/** A fake of the copy that answers `select().from(table)` with the rows of the CSV files, nothing else. */
function fakeDb(byTable: ReadonlyMap<object, readonly Record<string, unknown>[]>): LocalDb {
  const answer = (table: object) => {
    const rows = byTable.get(table) ?? [];
    return Object.assign(Promise.resolve(rows), { where: () => Promise.resolve(rows) });
  };
  return { select: () => ({ from: answer }) } as unknown as LocalDb;
}

export async function loadV3(): Promise<V3> {
  const both = (table: object, name: string, fix?: (column: Column, value: unknown) => unknown) => [
    ...rowsOf(table, records(`${COMMON}/${name}.csv`)),
    ...rowsOf(table, maybe(`${MINE}/${name}.csv`), (c, v) => owned(c, fix ? fix(c, v) : v)),
  ];
  const t = local.tables;
  const db = fakeDb(
    new Map<object, readonly Record<string, unknown>[]>([
      [t.materialCategories, rowsOf(t.materialCategories, maybe(`${COMMON}/material_categories.csv`))],
      [t.materials, both(t.materials, "materials")],
      [t.materialComponents, both(t.materialComponents, "material_components")],
      [t.regulations, both(t.regulations, "regulations")],
      [t.materialDoses, both(t.materialDoses, "material_doses")],
      [t.materialDescriptors, both(t.materialDescriptors, "material_descriptors")],
      [t.materialRelations, both(t.materialRelations, "material_relations")],
      [t.materialReferences, both(t.materialReferences, "material_references")],
      [t.labMaterials, rowsOf(t.labMaterials, records(`${MINE}/lab_materials.csv`), owned)],
      [t.labDilutions, rowsOf(t.labDilutions, records(`${MINE}/lab_dilutions.csv`), owned)],
      [t.labEvaluations, rowsOf(t.labEvaluations, records(`${MINE}/lab_evaluations.csv`), owned)],
      [t.labAxes, rowsOf(t.labAxes, records(`${MINE}/lab_axes.csv`), owned)],
      [t.dataVersion, []],
    ]),
  );
  const catalog = await loadCatalog(db, OWNER);
  const layer = buildIfraLayer({
    standards: rowsOf(t.ifraStandards, records(`${COMMON}/ifra_standards.csv`)) as never,
    limits: rowsOf(t.ifraLimits, records(`${COMMON}/ifra_limits.csv`)) as never,
    substances: rowsOf(t.ifraSubstances, records(`${COMMON}/ifra_substances.csv`)) as never,
    annex: rowsOf(t.ifraAnnex, records(`${COMMON}/ifra_annex.csv`)) as never,
    variantRules: rowsOf(t.ifraVariantRules, records(`${COMMON}/ifra_variant_rules.csv`)) as never,
    specExclusions: rowsOf(t.ifraSpecExclusions, maybe(`${COMMON}/ifra_spec_exclusions.csv`)) as never,
  });
  return { catalog, layer, ifra: toIfra(catalog, layer), card: (id) => ifraCard(catalog, layer, id) };
}

// ------------------------------------------------------------------ the v2

export interface V2 {
  readonly sources: Sources;
  readonly data: Dataset;
  readonly files: IfraFiles;
  readonly build: IfraBuild;
  readonly cards: ReadonlyMap<string, IfraCard>;
}

export function loadV2(): V2 {
  const sources = readSources(ROOT);
  const files: IfraFiles = {
    estandares: readFileSync(join(ROOT, "datos/ifra/51/estandares.csv"), "utf8"),
    estandarCas: readFileSync(join(ROOT, "datos/ifra/51/estandar-cas.csv"), "utf8"),
    amendment: "51",
  };
  return { sources, data: sources.v2, files, build: buildIfra(sources.v2, files), cards: ifraCards(sources.v2, files) };
}

// ------------------------------------------------------------------ the pairs

/** One of the user's lab materials, with its v2 pair and its two v3 materials. */
export interface Pair {
  readonly labId: string;
  readonly name: string;
  /** «versión de P00025», «versión de M00123» or «material nuevo». */
  readonly answer: string;
  /** The v2 container (a product P… or a material M…); null for a material without a pair. */
  readonly v2Id: string | null;
  readonly v2Material: string | null;
  readonly commonId: string;
  readonly mineId: string;
}

export function loadPairs(v2: Dataset, catalog: Catalog): Pair[] {
  const products = new Map(v2.products.map((p) => [p.id, p]));
  return records("migracion-v3/respuestas/laboratorio.csv")
    .map((r): Pair => {
      const answer = r.respuesta.trim();
      const target = answer.startsWith("versión de ") ? answer.slice("versión de ".length) : null;
      const commonId = uuidFor(`comun:${r.id}`);
      const mineId = uuidFor(`tuya:${r.id}`);
      const common = catalog.materials.get(commonId);
      if (!common || !catalog.materials.get(mineId)) throw new Error(`${r.id}: sin material común o sin versión tuya en los CSV`);
      return { labId: r.id, name: common.name, answer, v2Id: target, v2Material: target ? (products.get(target)?.materialId ?? target) : null, commonId, mineId };
    })
    .sort((a, b) => (a.labId < b.labId ? -1 : a.labId > b.labId ? 1 : 0));
}
