import { and, eq, inArray } from "drizzle-orm";
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
  /** Free notes (F7). */
  readonly notes: string;
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
  readonly notes?: string;
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
      /** The third diluent and on (V3-67), each with its share of what is poured. */
      readonly moreDiluents?: readonly { readonly materialId: string; readonly fraction: Ratio }[];
      /** The bottle of yours it was poured from (V3-67), when it was. */
      readonly dilutionId?: string | null;
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
    notes: input.notes ?? "",
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
  readonly notes?: string;
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
      ...(changes.notes !== undefined ? { notes: changes.notes } : {}),
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
    notes: source.notes,
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
    for (const d of await db.select().from(local.formulaEventDiluents).where(eq(local.formulaEventDiluents.eventId, e.id))) {
      await db.insert(local.formulaEventDiluents).values({ ...d, id: uuidv7(), eventId: newId, ownerId, createdAt: now() });
    }
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
      if (event.moreDiluents?.length) {
        if (!event.secondDiluent) throw new Error("a third diluent needs a first and a second one");
        const keys = [event.diluentId, event.secondDiluent.materialId, ...event.moreDiluents.map((d) => d.materialId)];
        if (new Set(keys).size !== keys.length) throw new Error("the diluents of a mixture are not repeated");
        for (const d of event.moreDiluents) {
          await usableMaterial(db, ownerId, d.materialId);
          if (d.fraction.num <= 0n) throw new RangeError("each diluent takes part of what is poured");
        }
        if (Ratio.sum([event.fraction, event.secondDiluent.fraction, ...event.moreDiluents.map((d) => d.fraction)]).cmp(Ratio.ONE) >= 0) {
          throw new RangeError("the diluents leave some to the first");
        }
      }
      if (event.dilutionId) {
        const [bottle] = await db.select().from(local.labDilutions).where(and(eq(local.labDilutions.id, event.dilutionId), eq(local.labDilutions.userId, ownerId)));
        if (!bottle || bottle.materialId !== event.materialId) throw new Error("a pour comes from a bottle of yours of that material");
      }
      Object.assign(row, {
        materialId: event.materialId,
        massUg: event.massUg.toString(),
        fraction: numericFromRatio(event.fraction),
        diluentId: event.diluentId,
        secondDiluentId: event.secondDiluent?.materialId ?? null,
        secondFraction: event.secondDiluent ? numericFromRatio(event.secondDiluent.fraction) : null,
        dilutionId: event.dilutionId ?? null,
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
  if (event.kind === "add") {
    // After the pour, in the queue's order: Supabase takes them only beside it.
    let position = 3;
    for (const d of event.moreDiluents ?? []) {
      await db.insert(local.formulaEventDiluents).values({
        id: uuidv7(),
        eventId: id,
        ownerId,
        position: position++,
        diluentId: d.materialId,
        fraction: numericFromRatio(d.fraction),
        createdAt: now(),
      });
    }
  }
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
    notes: f.notes ?? "",
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
  return (await loaderOf(db, catalog, ownerId)).formula(id, []);
}

/**
 * Frozen formulas of yours as the engine pours them (V3-49): each with its vector, from its formula
 * up to its event. One that cannot be built (its formula is not in the copy) is left out, never
 * guessed; the reason goes with it.
 */
export async function loadFrozen(
  db: LocalDb,
  catalog: Catalog,
  ownerId: string,
  ids: readonly string[],
): Promise<{ readonly materials: readonly Material[]; readonly failed: ReadonlyMap<string, string> }> {
  const loader = await loaderOf(db, catalog, ownerId);
  const materials: Material[] = [];
  const failed = new Map<string, string>();
  for (const id of ids) {
    try {
      materials.push(await loader.material(id, []));
    } catch (e) {
      failed.set(id, e instanceof Error ? e.message : String(e));
    }
  }
  return { materials, failed };
}

async function loaderOf(db: LocalDb, catalog: Catalog, ownerId: string) {
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
    const extra = events.length
      ? await db.select().from(local.formulaEventDiluents).where(inArray(local.formulaEventDiluents.eventId, events.map((e) => e.id)))
      : [];
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
    /** A pour's third diluent and on, in their order (V3-67); nothing when it has none. */
    const moreOf = async (eventId: string, at: readonly string[]) => {
      const rows = extra.filter((x) => x.eventId === eventId).sort((a, b) => Number(a.position) - Number(b.position));
      if (rows.length === 0) return {};
      const moreDiluents = [];
      for (const r of rows) moreDiluents.push({ material: await material(r.diluentId, at), fraction: ratio(r.fraction) });
      return { moreDiluents };
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
            ...(await moreOf(e.id, path)),
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

  return { formula, material };
}

/**
 * Saves one of your formulas as a material (plan 8.5, V3-49): a frozen formula of yours, up to one
 * of its events (by default the last), so that changing the formula afterwards does not change it.
 * It is poured in the formulas of its workbench, and in every one when its formula is marked
 * «acorde» (V3-19).
 */
export async function freezeFormula(db: LocalDb, ownerId: string, formulaId: string, input: { readonly name: string; readonly eventId?: string }): Promise<string> {
  await ownFormula(db, ownerId, formulaId);
  const events = (await db.select().from(local.formulaEvents).where(eq(local.formulaEvents.formulaId, formulaId))).sort((a, b) => (a.id < b.id ? -1 : 1));
  if (events.length === 0) throw new Error("an empty formula is no material");
  const eventId = input.eventId ?? events[events.length - 1].id;
  if (!events.some((e) => e.id === eventId)) throw new Error("a formula is frozen at one of its own events");
  const id = crypto.randomUUID();
  const stamp = now();
  await db.insert(local.materials).values({
    id,
    ownerId,
    name: nonEmpty(input.name, "a material"),
    kind: "frozen",
    solvent: false,
    aliases: [],
    otherCas: [],
    disputedFields: [],
    sourceFormulaId: formulaId,
    sourceEventId: eventId,
    createdAt: stamp,
    updatedAt: stamp,
  });
  return id;
}

/**
 * The frozen formulas of yours a formula may pour (V3-19): the ones of its workbench and the ones
 * marked «acorde» in any; never one of itself (it would contain itself).
 */
export function usableFrozen(catalog: Catalog, records: readonly FormulaRecord[], ownerId: string, formulaId: string): string[] {
  const byId = new Map(records.map((r) => [r.id, r]));
  const record = byId.get(formulaId);
  if (!record) throw new Error("not one of your formulas");
  return [...catalog.materials.values()]
    .filter((m) => {
      const source = m.kind === "frozen" && m.ownerId === ownerId && m.source ? byId.get(m.source.formulaId) : undefined;
      return source !== undefined && source.id !== formulaId && (source.workbenchId === record.workbenchId || source.markers.includes("accord"));
    })
    .map((m) => m.id);
}

/**
 * Moves one of your formulas to another of your workbenches (plan 8.1b), with its versions: a
 * version lives in its mother's workbench (V3-19), so the chain goes together. Returns how many
 * formulas moved.
 */
export async function moveFormula(db: LocalDb, ownerId: string, formulaId: string, workbenchId: string): Promise<number> {
  await ownFormula(db, ownerId, formulaId);
  await ownWorkbench(db, ownerId, workbenchId);
  const all = await loadFormulas(db, ownerId);
  const moving = new Set([formulaId]);
  for (let grew = true; grew; ) {
    grew = false;
    for (const f of all) {
      if (f.parentId && moving.has(f.parentId) && !moving.has(f.id)) {
        moving.add(f.id);
        grew = true;
      }
    }
  }
  const stamp = now();
  for (const id of moving) await db.update(local.formulas).set({ workbenchId, updatedAt: stamp }).where(eq(local.formulas.id, id));
  return moving.size;
}

/** Renames one of your workbenches. */
export async function renameWorkbench(db: LocalDb, ownerId: string, id: string, name: string): Promise<void> {
  await ownWorkbench(db, ownerId, id);
  await db.update(local.workbenches).set({ name: nonEmpty(name, "a workbench"), updatedAt: now() }).where(eq(local.workbenches.id, id));
}

/** Deletes one of your workbenches, only when no formula is left in it (the database refuses otherwise). */
export async function deleteWorkbench(db: LocalDb, ownerId: string, id: string): Promise<void> {
  await ownWorkbench(db, ownerId, id);
  if ((await loadFormulas(db, ownerId)).some((f) => f.workbenchId === id)) throw new Error("a workbench with formulas is not deleted");
  await db.delete(local.workbenches).where(eq(local.workbenches.id, id));
}

/**
 * Deletes one of your formulas with its history, as Supabase does (its events go with it; its
 * versions lose their mother). A formula saved as a material is not deleted: the material holds it
 * (V3-49), and the database refuses; that is said before trying.
 */
export async function deleteFormula(db: LocalDb, catalog: Catalog, ownerId: string, id: string): Promise<void> {
  await ownFormula(db, ownerId, id);
  const frozen = [...catalog.materials.values()].filter((m) => m.kind === "frozen" && m.source?.formulaId === id);
  if (frozen.length > 0) throw new FormulaInUse(frozen.map((m) => m.name));
  await db.update(local.formulas).set({ parentId: null, updatedAt: now() }).where(eq(local.formulas.parentId, id));
  await db.delete(local.formulas).where(eq(local.formulas.id, id));
  await db.delete(local.formulaEvents).where(eq(local.formulaEvents.formulaId, id));
}

/** A formula saved as a material, which therefore is not deleted. */
export class FormulaInUse extends Error {
  readonly materials: readonly string[];
  constructor(materials: readonly string[]) {
    super(`saved as a material: ${materials.join(", ")}`);
    this.materials = materials;
  }
}

/**
 * Where a formula is used as a material (plan 8.1b: «el corazón dice dónde se usa»): the formulas of
 * yours that pour any of the materials frozen from it.
 */
export async function usesOfFormula(db: LocalDb, catalog: Catalog, ownerId: string, id: string): Promise<{ readonly material: string; readonly formulaIds: readonly string[] }[]> {
  const frozen = [...catalog.materials.values()].filter((m) => m.kind === "frozen" && m.ownerId === ownerId && m.source?.formulaId === id);
  const out = [];
  for (const m of frozen) {
    const events = await db.select().from(local.formulaEvents).where(eq(local.formulaEvents.materialId, m.id));
    out.push({ material: m.name, formulaIds: [...new Set(events.filter((e) => e.kind === "add").map((e) => e.formulaId ?? ""))].filter((f) => f) });
  }
  return out;
}
