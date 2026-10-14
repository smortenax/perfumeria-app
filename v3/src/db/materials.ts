import type { PowerSyncSQLiteDatabase } from "@powersync/drizzle-driver";
import { and, eq } from "drizzle-orm";
import { Ratio } from "../core/arith/ratio";
import {
  AUTHORITIES,
  CONFIDENCES,
  DOSE_BASES,
  FAMILIES,
  MATERIAL_KINDS,
  STRENGTHS,
  TIERS,
  type Amount,
  type Authority,
  type Catalog,
  type CatalogMaterial,
  type Component,
  type Dose,
  type DoseBasis,
  type MaterialChanges,
  type MaterialFields,
  type MaterialKind,
  type NewMaterial,
  type Regulation,
  type RegulationKind,
} from "./catalog";
import { numericFromRatio, ratioFromNumeric } from "./exact";
import * as local from "./local/schema";

/**
 * The materials' repository (plan v3, step 3.2), always on the browser's copy, never straight
 * to Supabase: what it writes goes into PowerSync's upload queue, and RLS checks it up there.
 * The copy has none of Postgres' checks, so what is written is checked here first; otherwise
 * a mistake would only show when Supabase refused it.
 */
export type LocalDb = PowerSyncSQLiteDatabase<typeof local.tables>;

const now = () => new Date().toISOString();

// ---------------------------------------------------------------- reading

function oneOf<T extends string>(value: string | null, allowed: readonly T[], what: string): T {
  if (value === null || !(allowed as readonly string[]).includes(value)) {
    throw new Error(`Unknown ${what}: ${value}`);
  }
  return value as T;
}

const optionalOf = <T extends string>(value: string | null, allowed: readonly T[], what: string): T | null =>
  value === null ? null : oneOf(value, allowed, what);

function amountOf(row: typeof local.materialComponents.$inferSelect): Amount {
  switch (row.amountKind) {
    case "exact":
    case "max":
      return { kind: row.amountKind, value: required(ratioFromNumeric(row.value), "value") };
    case "range":
      return { kind: "range", min: required(ratioFromNumeric(row.min), "min"), max: required(ratioFromNumeric(row.max), "max") };
    case "unknown":
      return { kind: "unknown" };
    default:
      throw new Error(`Unknown amount kind: ${row.amountKind}`);
  }
}

function required<T>(value: T | null, what: string): T {
  if (value === null) throw new Error(`Missing ${what}`);
  return value;
}

function fieldsOf(row: typeof local.materials.$inferSelect): MaterialFields {
  return {
    solvent: row.solvent ?? false,
    aliases: row.aliases ?? [],
    cas: row.cas,
    otherCas: row.otherCas ?? [],
    species: row.species,
    part: row.part,
    process: row.process,
    chemotype: row.chemotype,
    inci: row.inci,
    origin: row.origin,
    categoryId: row.categoryId,
    form: row.form,
    basedOnId: row.basedOnId,
    grade: row.grade,
    supplier: row.supplier,
    purity: ratioFromNumeric(row.purity),
    house: row.house,
    code: row.code,
    odorTarget: row.odorTarget,
    synthesis: optionalOf(row.synthesis, ["synthetic", "natural", "semisynthetic"] as const, "synthesis"),
    isomers: row.isomers,
    family: optionalOf(row.family, FAMILIES, "family"),
    familyDetail: row.familyDetail,
    facets: row.facets,
    tier: optionalOf(row.tier, TIERS, "tier"),
    evolution: row.evolution,
    tenacity: row.tenacity,
    strength: optionalOf(row.strength, STRENGTHS, "strength"),
    threshold: row.threshold,
    diffusion: row.diffusion,
    blendEffect: row.blendEffect,
    role: row.role,
    recommendedDilution: row.recommendedDilution,
    sources: row.sources,
    confidence: optionalOf(row.confidence, CONFIDENCES, "confidence"),
    disputedFields: row.disputedFields ?? [],
    ifraUnverified: row.ifraUnverified,
  };
}

function group<T>(rows: readonly T[], key: (row: T) => string | null): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    if (k === null) continue;
    out.set(k, [...(out.get(k) ?? []), row]);
  }
  return out;
}

/** Everything the copy holds: the common materials and the user's, with their tables, and what the user has. */
export async function loadCatalog(db: LocalDb, userId: string): Promise<Catalog> {
  const [materialRows, componentRows, regulationRows, doseRows, categoryRows, haveRows, versionRows] = await Promise.all([
    db.select().from(local.materials),
    db.select().from(local.materialComponents),
    db.select().from(local.regulations),
    db.select().from(local.materialDoses),
    db.select().from(local.materialCategories),
    db.select().from(local.labMaterials).where(eq(local.labMaterials.userId, userId)),
    db.select().from(local.dataVersion),
  ]);
  const components = group(componentRows, (r) => r.materialId);
  const regulations = group(regulationRows, (r) => r.materialId);
  const doses = group(doseRows, (r) => r.materialId);
  const materials = new Map<string, CatalogMaterial>();
  for (const row of materialRows) {
    materials.set(row.id, {
      id: row.id,
      ownerId: row.ownerId,
      name: row.name ?? "",
      kind: oneOf(row.kind, MATERIAL_KINDS, "material kind"),
      ...fieldsOf(row),
      components: (components.get(row.id) ?? []).map(
        (c): Component => ({
          id: c.id,
          componentId: required(c.componentId, "component"),
          amount: amountOf(c),
          authority: oneOf(c.authority, AUTHORITIES, "authority"),
          source: c.source ?? "",
        }),
      ),
      regulations: (regulations.get(row.id) ?? []).map(
        (r): Regulation => ({
          id: r.id,
          regime: oneOf(r.regime, ["ifra", "manufacturer"] as const, "regime"),
          category: r.category,
          kind: oneOf(r.kind, ["max", "prohibited", "requirement"] as const, "regulation kind"),
          maxValue: ratioFromNumeric(r.maxValue),
          groupKey: r.groupKey,
          requirement: r.requirement,
          authority: oneOf(r.authority, AUTHORITIES, "authority"),
          source: r.source ?? "",
        }),
      ),
      doses: (doses.get(row.id) ?? []).map(
        (d): Dose => ({
          id: d.id,
          min: ratioFromNumeric(d.min),
          typical: ratioFromNumeric(d.typical),
          max: ratioFromNumeric(d.max),
          basis: oneOf(d.basis, DOSE_BASES, "dose basis"),
          authority: oneOf(d.authority, AUTHORITIES, "authority"),
          source: d.source ?? "",
          disputed: d.disputed ?? false,
          notes: d.notes,
        }),
      ),
    });
  }
  return {
    materials,
    categories: new Map(categoryRows.map((c) => [c.id, { id: c.id, name: c.name ?? "", aliases: c.aliases ?? [] }])),
    have: new Set(haveRows.map((h) => required(h.materialId, "material"))),
    dataCommit: versionRows[0]?.commit ?? null,
  };
}

// ---------------------------------------------------------------- checking what is written

const isFraction = (r: Ratio, zeroAllowed = false) => (zeroAllowed ? r.num >= 0n : r.num > 0n) && r.cmp(Ratio.ONE) <= 0;

function checkFields(fields: Partial<MaterialFields>): void {
  if (fields.purity && !isFraction(fields.purity)) throw new RangeError("purity must be a fraction in (0, 1]");
  if (fields.family) oneOf(fields.family, FAMILIES, "family");
  if (fields.tier) oneOf(fields.tier, TIERS, "tier");
  if (fields.strength) oneOf(fields.strength, STRENGTHS, "strength");
  if (fields.confidence) oneOf(fields.confidence, CONFIDENCES, "confidence");
}

/** A user creates any kind but a frozen formula: that one comes from freezing a formula (phase 8). */
function checkKind(kind: MaterialKind): void {
  oneOf(kind, MATERIAL_KINDS, "material kind");
  if (kind === "frozen") throw new Error("a frozen formula is made by freezing a formula, not created by hand");
}

function checkAmount(amount: Amount): void {
  if (amount.kind === "exact") {
    // A documented 0 is a fact («it does not carry it»; IFRA's annex says so of some constituents), not a gap.
    if (!isFraction(amount.value, true)) throw new RangeError("an exact amount is a fraction in [0, 1]");
  } else if (amount.kind === "max") {
    if (!isFraction(amount.value)) throw new RangeError("a maximum is a fraction in (0, 1]");
  } else if (amount.kind === "range") {
    if (!isFraction(amount.min, true) || !isFraction(amount.max) || amount.min.cmp(amount.max) > 0) {
      throw new RangeError("a range goes from min to max, both fractions, min ≤ max");
    }
  }
}

const checkSource = (source: string) => {
  if (source.trim() === "") throw new Error("every figure carries its source");
};

/** One of the user's materials, from the copy, or an error: nobody edits a common one or someone else's. */
async function ownMaterial(db: LocalDb, ownerId: string, id: string) {
  const [row] = await db
    .select()
    .from(local.materials)
    .where(and(eq(local.materials.id, id), eq(local.materials.ownerId, ownerId)));
  if (!row) throw new Error("not one of your materials");
  return row;
}

/** A material the user can see: a common one or their own. */
async function visibleMaterial(db: LocalDb, ownerId: string, id: string) {
  const [row] = await db.select().from(local.materials).where(eq(local.materials.id, id));
  if (!row || (row.ownerId !== null && row.ownerId !== ownerId)) throw new Error("no such material");
  return row;
}

// ---------------------------------------------------------------- writing

/** The fields as the copy keeps them: the purity as exact text, the lists as lists of its own. */
function fieldColumns(fields: Partial<MaterialFields>) {
  const { purity, aliases, otherCas, disputedFields, ...rest } = fields;
  return {
    ...rest,
    ...(purity !== undefined ? { purity: purity === null ? null : numericFromRatio(purity) } : {}),
    ...(aliases !== undefined ? { aliases: [...aliases] } : {}),
    ...(otherCas !== undefined ? { otherCas: [...otherCas] } : {}),
    ...(disputedFields !== undefined ? { disputedFields: [...disputedFields] } : {}),
  };
}

/** Creates one of the user's materials; returns its id. */
export async function createMaterial(db: LocalDb, ownerId: string, input: NewMaterial): Promise<string> {
  checkKind(input.kind);
  checkFields(input);
  if (input.name.trim() === "") throw new Error("a material has a name");
  if (input.basedOnId) await visibleMaterial(db, ownerId, input.basedOnId);
  const id = crypto.randomUUID();
  const stamp = now();
  await db.insert(local.materials).values({
    solvent: false,
    aliases: [],
    otherCas: [],
    disputedFields: [],
    ...fieldColumns(input),
    id,
    ownerId,
    name: input.name.trim(),
    kind: input.kind,
    createdAt: stamp,
    updatedAt: stamp,
  });
  return id;
}

/** Changes one of the user's materials. A frozen formula stays one, and nothing becomes one. */
export async function updateMaterial(
  db: LocalDb,
  ownerId: string,
  id: string,
  changes: MaterialChanges & { readonly kind?: MaterialKind },
): Promise<void> {
  const row = await ownMaterial(db, ownerId, id);
  if (changes.kind !== undefined && changes.kind !== row.kind) {
    if (row.kind === "frozen") throw new Error("a frozen formula stays frozen");
    checkKind(changes.kind);
  }
  checkFields(changes);
  if (changes.name !== undefined && changes.name.trim() === "") throw new Error("a material has a name");
  if (changes.basedOnId) {
    if (changes.basedOnId === id) throw new Error("a material is not based on itself");
    await visibleMaterial(db, ownerId, changes.basedOnId);
  }
  await db
    .update(local.materials)
    .set({ ...fieldColumns(changes), ...(changes.name !== undefined ? { name: changes.name.trim() } : {}), ...(changes.kind ? { kind: changes.kind } : {}), updatedAt: now() })
    .where(eq(local.materials.id, id));
}

export async function deleteMaterial(db: LocalDb, ownerId: string, id: string): Promise<void> {
  await ownMaterial(db, ownerId, id);
  await db.delete(local.materials).where(eq(local.materials.id, id));
}

/** Adds a component to one of the user's materials: a common material or another of theirs, never itself. */
export async function addComponent(
  db: LocalDb,
  ownerId: string,
  materialId: string,
  componentId: string,
  amount: Amount,
  authority: Authority,
  source: string,
): Promise<string> {
  const container = await ownMaterial(db, ownerId, materialId);
  if (container.kind === "frozen") throw new Error("the composition of a frozen formula is not changed");
  if (componentId === materialId) throw new Error("a material does not contain itself");
  await visibleMaterial(db, ownerId, componentId);
  checkAmount(amount);
  oneOf(authority, AUTHORITIES, "authority");
  checkSource(source);
  const id = crypto.randomUUID();
  const stamp = now();
  await db.insert(local.materialComponents).values({
    id,
    materialId,
    ownerId,
    componentId,
    amountKind: amount.kind,
    value: amount.kind === "exact" || amount.kind === "max" ? numericFromRatio(amount.value) : null,
    min: amount.kind === "range" ? numericFromRatio(amount.min) : null,
    max: amount.kind === "range" ? numericFromRatio(amount.max) : null,
    authority,
    source: source.trim(),
    createdAt: stamp,
    updatedAt: stamp,
  });
  return id;
}

export async function removeComponent(db: LocalDb, ownerId: string, componentRowId: string): Promise<void> {
  const [row] = await db.select().from(local.materialComponents).where(eq(local.materialComponents.id, componentRowId));
  if (!row?.materialId) throw new Error("no such component");
  const container = await ownMaterial(db, ownerId, row.materialId);
  if (container.kind === "frozen") throw new Error("the composition of a frozen formula is not changed");
  await db.delete(local.materialComponents).where(eq(local.materialComponents.id, componentRowId));
}

export interface NewRegulation {
  readonly regime: "ifra" | "manufacturer";
  readonly category?: string | null;
  readonly kind: RegulationKind;
  readonly maxValue?: Ratio | null;
  readonly groupKey?: string | null;
  readonly requirement?: string | null;
  readonly authority: Authority;
  readonly source: string;
}

/** Adds a limit to one of the user's materials (V3-3: the user gives IFRA's or a maker's limits to their own). */
export async function addRegulation(db: LocalDb, ownerId: string, materialId: string, regulation: NewRegulation): Promise<string> {
  await ownMaterial(db, ownerId, materialId);
  oneOf(regulation.regime, ["ifra", "manufacturer"] as const, "regime");
  oneOf(regulation.authority, AUTHORITIES, "authority");
  checkSource(regulation.source);
  const maxValue = regulation.maxValue ?? null;
  if (regulation.kind === "max" && (maxValue === null || !isFraction(maxValue, true))) throw new RangeError("a maximum is a fraction in [0, 1]");
  if (regulation.kind !== "max" && maxValue !== null) throw new Error("only a maximum carries a value");
  if (regulation.kind === "requirement" && !regulation.requirement?.trim()) throw new Error("a requirement says what has to be met");
  const id = crypto.randomUUID();
  const stamp = now();
  await db.insert(local.regulations).values({
    id,
    materialId,
    ownerId,
    regime: regulation.regime,
    category: regulation.category ?? null,
    kind: oneOf(regulation.kind, ["max", "prohibited", "requirement"] as const, "regulation kind"),
    maxValue: maxValue === null ? null : numericFromRatio(maxValue),
    groupKey: regulation.groupKey ?? null,
    requirement: regulation.requirement?.trim() || null,
    authority: regulation.authority,
    source: regulation.source.trim(),
    createdAt: stamp,
    updatedAt: stamp,
  });
  return id;
}

export async function removeRegulation(db: LocalDb, ownerId: string, regulationId: string): Promise<void> {
  const [row] = await db.select().from(local.regulations).where(eq(local.regulations.id, regulationId));
  if (!row?.materialId) throw new Error("no such regulation");
  await ownMaterial(db, ownerId, row.materialId);
  await db.delete(local.regulations).where(eq(local.regulations.id, regulationId));
}

export interface NewDose {
  readonly min?: Ratio | null;
  readonly typical?: Ratio | null;
  readonly max?: Ratio | null;
  readonly basis: DoseBasis;
  readonly authority: Authority;
  readonly source: string;
  readonly notes?: string | null;
}

/** Adds a dose of a source to one of the user's materials, always with its basis (V3-14). */
export async function addDose(db: LocalDb, ownerId: string, materialId: string, dose: NewDose): Promise<string> {
  await ownMaterial(db, ownerId, materialId);
  oneOf(dose.basis, DOSE_BASES, "dose basis");
  oneOf(dose.authority, AUTHORITIES, "authority");
  checkSource(dose.source);
  const [min, typical, max] = [dose.min ?? null, dose.typical ?? null, dose.max ?? null];
  if (min === null && typical === null && max === null) throw new Error("a dose has at least one figure");
  if ((min && !isFraction(min, true)) || (typical && !isFraction(typical)) || (max && !isFraction(max))) {
    throw new RangeError("a dose is a fraction in [0, 1]");
  }
  if (min && max && min.cmp(max) > 0) throw new RangeError("a dose's minimum is not over its maximum");
  const id = crypto.randomUUID();
  const stamp = now();
  await db.insert(local.materialDoses).values({
    id,
    materialId,
    ownerId,
    min: min && numericFromRatio(min),
    typical: typical && numericFromRatio(typical),
    max: max && numericFromRatio(max),
    basis: dose.basis,
    authority: dose.authority,
    source: dose.source.trim(),
    disputed: false,
    notes: dose.notes ?? null,
    createdAt: stamp,
    updatedAt: stamp,
  });
  return id;
}

export async function removeDose(db: LocalDb, ownerId: string, doseId: string): Promise<void> {
  const [row] = await db.select().from(local.materialDoses).where(eq(local.materialDoses.id, doseId));
  if (!row?.materialId) throw new Error("no such dose");
  await ownMaterial(db, ownerId, row.materialId);
  await db.delete(local.materialDoses).where(eq(local.materialDoses.id, doseId));
}

/** Marks or unmarks a material as one the user has (V3-3). */
export async function setHave(db: LocalDb, userId: string, materialId: string, have: boolean): Promise<void> {
  const rows = await db
    .select()
    .from(local.labMaterials)
    .where(and(eq(local.labMaterials.userId, userId), eq(local.labMaterials.materialId, materialId)));
  if (have && rows.length === 0) {
    await visibleMaterial(db, userId, materialId);
    await db.insert(local.labMaterials).values({ id: crypto.randomUUID(), userId, materialId, createdAt: now() });
  } else if (!have) {
    for (const row of rows) await db.delete(local.labMaterials).where(eq(local.labMaterials.id, row.id));
  }
}
