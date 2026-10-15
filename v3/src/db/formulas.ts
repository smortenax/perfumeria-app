import { and, eq } from "drizzle-orm";
import { Ratio } from "../core/arith/ratio";
import type { Change, Formula } from "../core/model/formula";
import type { Material } from "../core/model/material";
import { makeVector } from "../core/model/vector";
import { compose } from "../core/compose";
import type { Catalog, CatalogMaterial } from "./catalog";
import { bigintFromText, numericFromRatio, ratioFromNumeric } from "./exact";
import * as local from "./local/schema";
import type { LocalDb } from "./materials";
import { uuidv7 } from "./uuid7";

/**
 * Your workbenches, formulas and their histories (plan v3, phase 7), always on the browser's copy
 * (V3-9): what is written waits in the upload queue. Each write checks what Supabase would refuse
 * (db/schema/formulas.ts and the migration formulas_rls), so it never waits in the queue to fail.
 */

export const FORMULA_MARKERS = ["accord", "finished"] as const;
export type FormulaMarker = (typeof FORMULA_MARKERS)[number];

export interface Workbench {
  readonly id: string;
  readonly name: string;
  readonly notes: string | null;
}

export interface FormulaRecord {
  readonly id: string;
  readonly workbenchId: string;
  readonly parentId: string | null;
  readonly name: string;
  readonly intention: string;
  readonly containerCapacityMl: Ratio | null;
  readonly containerTareUg: bigint | null;
  readonly workBatchUg: bigint | null;
  readonly finalBatchUg: bigint | null;
  readonly markers: readonly FormulaMarker[];
  readonly role: string | null;
  readonly createdAt: string | null;
}

export interface NewFormula {
  readonly name: string;
  /** Required unless it is a version: then it is born in its mother's (V3-19). */
  readonly workbenchId?: string;
  readonly parentId?: string | null;
  readonly intention?: string;
  readonly containerCapacityMl?: Ratio | null;
  readonly containerTareUg?: bigint | null;
  readonly workBatchUg?: bigint | null;
  readonly finalBatchUg?: bigint | null;
  readonly markers?: readonly FormulaMarker[];
  readonly role?: string | null;
}

/** One event as written (decisions §3.4): the engine's changes, by material id. */
export type NewEvent =
  | {
      readonly kind: "add";
      readonly materialId: string;
      readonly massUg: bigint;
      readonly fraction: Ratio;
      readonly diluentId: string | null;
      readonly secondDiluent?: { readonly materialId: string; readonly fraction: Ratio };
    }
  | { readonly kind: "set_mass"; readonly target: string; readonly massUg: bigint }
  | { readonly kind: "remove"; readonly target: string }
  | { readonly kind: "reweigh"; readonly grossUg: bigint; readonly tareUg: bigint }
  | { readonly kind: "note"; readonly text: string };

const now = () => new Date().toISOString();
const text = (value: bigint | null | undefined) => (value === null || value === undefined ? null : value.toString());

async function ownWorkbench(db: LocalDb, ownerId: string, id: string) {
  const [row] = await db.select().from(local.workbenches).where(and(eq(local.workbenches.id, id), eq(local.workbenches.ownerId, ownerId)));
  if (!row) throw new Error("not one of your workbenches");
  return row;
}

async function ownFormula(db: LocalDb, ownerId: string, id: string) {
  const [row] = await db.select().from(local.formulas).where(and(eq(local.formulas.id, id), eq(local.formulas.ownerId, ownerId)));
  if (!row) throw new Error("not one of your formulas");
  return row;
}

async function usableMaterial(db: LocalDb, ownerId: string, id: string) {
  const [row] = await db.select().from(local.materials).where(eq(local.materials.id, id));
  if (!row || (row.ownerId !== null && row.ownerId !== ownerId)) throw new Error("a formula uses only common materials or yours");
  return row;
}

const nonEmpty = (value: string, what: string) => {
  if (value.trim() === "") throw new Error(`${what} has a name`);
  return value.trim();
};

export async function createWorkbench(db: LocalDb, ownerId: string, input: { readonly name: string; readonly notes?: string | null }): Promise<string> {
  const id = crypto.randomUUID();
  const stamp = now();
  await db.insert(local.workbenches).values({ id, ownerId, name: nonEmpty(input.name, "a workbench"), notes: input.notes?.trim() || null, createdAt: stamp, updatedAt: stamp });
  return id;
}

/** A formula in one of your workbenches; a version (parentId) is born in its mother's (V3-19). */
export async function createFormula(db: LocalDb, ownerId: string, input: NewFormula): Promise<string> {
  let workbenchId = input.workbenchId ?? null;
  if (input.parentId) {
    const parent = await ownFormula(db, ownerId, input.parentId);
    if (workbenchId && workbenchId !== parent.workbenchId) throw new Error("a version is born in its mother's workbench");
    workbenchId = parent.workbenchId;
  }
  if (!workbenchId) throw new Error("every formula lives in a workbench");
  await ownWorkbench(db, ownerId, workbenchId);
  const markers = [...new Set(input.markers ?? [])];
  for (const m of markers) if (!(FORMULA_MARKERS as readonly string[]).includes(m)) throw new Error(`unknown marker: ${m}`);
  const positive = (value: bigint | null | undefined, what: string) => {
    if (value !== null && value !== undefined && value <= 0n) throw new RangeError(`${what} is above 0`);
  };
  positive(input.workBatchUg, "a work batch");
  positive(input.finalBatchUg, "a final batch");
  if (input.containerTareUg !== null && input.containerTareUg !== undefined && input.containerTareUg < 0n) throw new RangeError("a tare is not below 0");
  if (input.containerCapacityMl && input.containerCapacityMl.num <= 0n) throw new RangeError("a capacity is above 0");
  const id = crypto.randomUUID();
  const stamp = now();
  await db.insert(local.formulas).values({
    id,
    ownerId,
    workbenchId,
    parentId: input.parentId ?? null,
    name: nonEmpty(input.name, "a formula"),
    intention: input.intention ?? "",
    containerCapacityMl: input.containerCapacityMl ? numericFromRatio(input.containerCapacityMl) : null,
    containerTareUg: text(input.containerTareUg),
    workBatchUg: text(input.workBatchUg),
    finalBatchUg: text(input.finalBatchUg),
    markers,
    role: input.role?.trim() || null,
    createdAt: stamp,
    updatedAt: stamp,
  });
  return id;
}

/** What the header of a formula may change (decisions §3.3): its name, intention, container and batches. */
export interface FormulaHeaderChanges {
  readonly name?: string;
  readonly intention?: string;
  readonly containerCapacityMl?: Ratio | null;
  readonly containerTareUg?: bigint | null;
  readonly workBatchUg?: bigint | null;
  readonly finalBatchUg?: bigint | null;
  readonly markers?: readonly FormulaMarker[];
  readonly role?: string | null;
}

/** Changes the header of one of your formulas; its history is never changed (it is only added to). */
export async function updateFormula(db: LocalDb, ownerId: string, id: string, changes: FormulaHeaderChanges): Promise<void> {
  await ownFormula(db, ownerId, id);
  const positive = (value: bigint | null | undefined, what: string) => {
    if (value !== null && value !== undefined && value <= 0n) throw new RangeError(`${what} is above 0`);
  };
  positive(changes.workBatchUg, "a work batch");
  positive(changes.finalBatchUg, "a final batch");
  if (changes.containerTareUg !== null && changes.containerTareUg !== undefined && changes.containerTareUg < 0n) throw new RangeError("a tare is not below 0");
  if (changes.containerCapacityMl && changes.containerCapacityMl.num <= 0n) throw new RangeError("a capacity is above 0");
  for (const m of changes.markers ?? []) if (!(FORMULA_MARKERS as readonly string[]).includes(m)) throw new Error(`unknown marker: ${m}`);
  await db
    .update(local.formulas)
    .set({
      ...(changes.name !== undefined ? { name: nonEmpty(changes.name, "a formula") } : {}),
      ...(changes.intention !== undefined ? { intention: changes.intention } : {}),
      ...(changes.containerCapacityMl !== undefined ? { containerCapacityMl: changes.containerCapacityMl ? numericFromRatio(changes.containerCapacityMl) : null } : {}),
      ...(changes.containerTareUg !== undefined ? { containerTareUg: text(changes.containerTareUg) } : {}),
      ...(changes.workBatchUg !== undefined ? { workBatchUg: text(changes.workBatchUg) } : {}),
      ...(changes.finalBatchUg !== undefined ? { finalBatchUg: text(changes.finalBatchUg) } : {}),
      ...(changes.markers !== undefined ? { markers: [...new Set(changes.markers)] } : {}),
      ...(changes.role !== undefined ? { role: changes.role?.trim() || null } : {}),
      updatedAt: now(),
    })
    .where(eq(local.formulas.id, id));
}

/**
 * A new formula from one of yours (P44, §3.2): a version of it (its parentId, in its workbench) or a
 * variation that goes on alone; either takes a copy of its history, with new ids in the same order.
 */
export async function copyFormula(
  db: LocalDb,
  ownerId: string,
  sourceId: string,
  input: { readonly name: string; readonly asVersion: boolean; readonly containerCapacityMl?: Ratio | null; readonly containerTareUg?: bigint | null },
): Promise<string> {
  const [source] = (await loadFormulas(db, ownerId)).filter((f) => f.id === sourceId);
  if (!source) throw new Error("not one of your formulas");
  const id = await createFormula(db, ownerId, {
    name: input.name,
    workbenchId: source.workbenchId,
    parentId: input.asVersion ? source.id : null,
    intention: source.intention,
    containerCapacityMl: input.containerCapacityMl !== undefined ? input.containerCapacityMl : source.containerCapacityMl,
    containerTareUg: input.containerTareUg !== undefined ? input.containerTareUg : source.containerTareUg,
    workBatchUg: source.workBatchUg,
    finalBatchUg: source.finalBatchUg,
    role: source.role,
  });
  const events = (await db.select().from(local.formulaEvents).where(eq(local.formulaEvents.formulaId, sourceId))).sort((a, b) => (a.id < b.id ? -1 : 1));
  const renamed = new Map<string, string>();
  for (const e of events) {
    const newId = uuidv7();
    renamed.set(e.id, newId);
    await db.insert(local.formulaEvents).values({ ...e, id: newId, formulaId: id, ownerId, target: e.target ? (renamed.get(e.target) ?? e.target) : null, createdAt: now() });
  }
  return id;
}

const isFraction = (r: Ratio) => r.num > 0n && r.cmp(Ratio.ONE) <= 0;

/**
 * Adds one event to the history of one of your formulas, with a UUID v7 for its order (plan 7.2).
 * A history is only added to: undoing adds the opposite event (plan 8.2).
 */
export async function addEvent(db: LocalDb, ownerId: string, formulaId: string, event: NewEvent, id: string = uuidv7()): Promise<string> {
  await ownFormula(db, ownerId, formulaId);
  const row: typeof local.formulaEvents.$inferInsert = { id, formulaId, ownerId, kind: event.kind, createdAt: now() };
  switch (event.kind) {
    case "add": {
      if (event.massUg <= 0n) throw new RangeError("a pour weighs above 0");
      if (!isFraction(event.fraction)) throw new RangeError("a fraction of pure matter is in (0, 1]");
      if (!event.fraction.eq(Ratio.ONE) && !event.diluentId) throw new Error("a diluted pour says its diluent");
      await usableMaterial(db, ownerId, event.materialId);
      if (event.diluentId) await usableMaterial(db, ownerId, event.diluentId);
      if (event.secondDiluent) {
        await usableMaterial(db, ownerId, event.secondDiluent.materialId);
        if (event.secondDiluent.fraction.num <= 0n || event.fraction.add(event.secondDiluent.fraction).cmp(Ratio.ONE) >= 0) {
          throw new RangeError("a second diluent takes part of what is poured, and leaves some to the first");
        }
      }
      Object.assign(row, {
        materialId: event.materialId,
        massUg: event.massUg.toString(),
        fraction: numericFromRatio(event.fraction),
        diluentId: event.diluentId,
        secondDiluentId: event.secondDiluent?.materialId ?? null,
        secondFraction: event.secondDiluent ? numericFromRatio(event.secondDiluent.fraction) : null,
      });
      break;
    }
    case "set_mass":
    case "remove": {
      const [target] = await db.select().from(local.formulaEvents).where(eq(local.formulaEvents.id, event.target));
      if (!target || target.formulaId !== formulaId || target.kind !== "add") throw new Error("a change points at a pour of the same formula");
      if (event.kind === "set_mass" && event.massUg <= 0n) throw new RangeError("a mass is above 0");
      Object.assign(row, { target: event.target, ...(event.kind === "set_mass" ? { massUg: event.massUg.toString() } : {}) });
      break;
    }
    case "reweigh":
      if (event.tareUg < 0n || event.grossUg <= event.tareUg) throw new RangeError("a gross weight is above its tare");
      Object.assign(row, { grossUg: event.grossUg.toString(), tareUg: event.tareUg.toString() });
      break;
    case "note":
      if (event.text.trim() === "") throw new Error("a note has a text");
      Object.assign(row, { text: event.text.trim() });
      break;
  }
  await db.insert(local.formulaEvents).values(row);
  return id;
}

export async function loadWorkbenches(db: LocalDb, ownerId: string): Promise<Workbench[]> {
  const rows = await db.select().from(local.workbenches).where(eq(local.workbenches.ownerId, ownerId));
  return rows.map((w) => ({ id: w.id, name: w.name ?? "", notes: w.notes })).sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export async function loadFormulas(db: LocalDb, ownerId: string): Promise<FormulaRecord[]> {
  const rows = await db.select().from(local.formulas).where(eq(local.formulas.ownerId, ownerId));
  return rows.map((f) => ({
    id: f.id,
    workbenchId: f.workbenchId ?? "",
    parentId: f.parentId,
    name: f.name ?? "",
    intention: f.intention ?? "",
    containerCapacityMl: ratioFromNumeric(f.containerCapacityMl),
    containerTareUg: f.containerTareUg ? bigintFromText(f.containerTareUg) : null,
    workBatchUg: f.workBatchUg ? bigintFromText(f.workBatchUg) : null,
    finalBatchUg: f.finalBatchUg ? bigintFromText(f.finalBatchUg) : null,
    markers: (f.markers ?? []) as FormulaMarker[],
    role: f.role,
    createdAt: f.createdAt,
  }));
}

/** A material of the catalog as the engine sees it: its id is its key, two lines of it are one substance. */
export function engineMaterial(m: CatalogMaterial): Material {
  const kind = m.kind === "provisional" ? "provisional" : m.kind === "frozen" ? "formula" : m.ownerId === null ? "base" : "own";
  return { key: m.id, kind, name: m.name, ...(m.cas ? { cas: m.cas } : {}), ...(m.solvent ? { solvent: true } : {}) };
}

/**
 * One of your formulas, as the engine reads it (decisions §3.4): its header and its history, in the
 * order of its ids. A frozen formula it uses (V3-49) comes with its vector: its own formula, composed
 * up to the event it was frozen at; exact, and the same forever, because a history is only added to.
 */
export async function loadFormula(db: LocalDb, catalog: Catalog, ownerId: string, id: string): Promise<Formula> {
  const records = new Map((await loadFormulas(db, ownerId)).map((f) => [f.id, f]));
  const built = new Map<string, Formula>();
  const frozen = new Map<string, Material>();

  async function material(materialId: string | null, inside: readonly string[]): Promise<Material> {
    const m = materialId ? catalog.materials.get(materialId) : undefined;
    if (!m) throw new Error(`a formula's material is not in the copy: ${materialId}`);
    if (m.kind !== "frozen") return engineMaterial(m);
    const known = frozen.get(m.id);
    if (known) return known;
    if (!m.source) throw new Error(`«${m.name}» is a frozen formula without its formula (V3-49)`);
    if (inside.includes(m.source.formulaId)) throw new Error(`«${m.name}» contains itself`);
    const source = await formula(m.source.formulaId, inside);
    const upTo = source.history.findIndex((c) => c.id === m.source!.eventId) + 1;
    if (upTo === 0) throw new Error(`«${m.name}»: its event is not in its formula`);
    const composition = compose(source, upTo);
    const made: Material = { ...engineMaterial(m), vector: makeVector(composition.parts.map((p) => ({ material: p.material, amount: p.massUg }))) };
    frozen.set(m.id, made);
    return made;
  }

  async function formula(formulaId: string, inside: readonly string[]): Promise<Formula> {
    const done = built.get(formulaId);
    if (done) return done;
    const record = records.get(formulaId);
    if (!record) throw new Error("not one of your formulas");
    const path = [...inside, formulaId];
    const events = (await db.select().from(local.formulaEvents).where(eq(local.formulaEvents.formulaId, formulaId))).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const mass = (value: string | null) => {
      const v = bigintFromText(value);
      if (v === null) throw new Error("an event lost a mass");
      return v;
    };
    const ratio = (value: string | null) => {
      const r = ratioFromNumeric(value);
      if (!r) throw new Error("an event lost a figure");
      return r;
    };
    const history: Change[] = [];
    for (const e of events) {
      switch (e.kind) {
        case "add":
          history.push({
            kind: "add",
            id: e.id,
            material: await material(e.materialId, path),
            massUg: mass(e.massUg),
            fraction: ratio(e.fraction),
            diluent: e.diluentId ? await material(e.diluentId, path) : null,
            ...(e.secondDiluentId ? { secondDiluent: { material: await material(e.secondDiluentId, path), fraction: ratio(e.secondFraction) } } : {}),
          });
          break;
        case "set_mass":
          history.push({ kind: "set-mass", id: e.id, target: e.target ?? "", massUg: mass(e.massUg) });
          break;
        case "remove":
          history.push({ kind: "remove", id: e.id, target: e.target ?? "" });
          break;
        case "reweigh":
          history.push({ kind: "reweigh", id: e.id, grossUg: mass(e.grossUg), tareUg: mass(e.tareUg) });
          break;
        case "note":
          history.push({ kind: "note", id: e.id, text: e.text ?? "" });
          break;
        default:
          throw new Error(`unknown event: ${e.kind}`);
      }
    }
    const f: Formula = {
      header: {
        name: record.name,
        intention: record.intention,
        container: record.containerCapacityMl || record.containerTareUg !== null ? { capacityMl: record.containerCapacityMl, tareUg: record.containerTareUg } : null,
        workBatchUg: record.workBatchUg,
        finalBatchUg: record.finalBatchUg,
      },
      history,
    };
    built.set(formulaId, f);
    return f;
  }

  return formula(id, []);
}
