import { and, eq, inArray } from "drizzle-orm";
import type { Ratio } from "../core/arith/ratio";
import {
  BATTERY_AXES, BATTERY_STATES, type BatteryAxis, type BatteryState, BIASES, BLIND_LABELS, type BlindLabel, BLOCKS, type Block, COMPLEXITY, CURVE_LEVELS,
  CURVE_SEGMENTS, type CurveLevel, DECAY, EFFECT_ENERGY, EFFECT_RICHNESS, FAMILY_CODES, FAMILY_SCHEMES, type FamilyScheme, INTENSITY_MAX, INTENSITY_MIN,
  MOMENTS, type Moment, PUFF, R1, R2, R3, ROLES, THING_OR_PLACE, VERSATILITY,
} from "../tasting/vocabulary";
import { ratioFromNumeric } from "./exact";
import * as local from "./local/schema";
import type { LocalDb } from "./materials";

/**
 * Your tastings (V3-60 to V3-63), always on the browser's copy (V3-9). Each write checks what
 * Supabase would refuse (db/schema/tastings.ts and the migration tastings_rls), so nothing waits in
 * the upload queue to fail. Nothing here writes in materials.
 */

export interface TastingSession {
  readonly id: string;
  readonly startedAt: string;
  readonly endedAt: string | null;
  readonly note: string | null;
}

export interface TastingStrip {
  readonly id: string;
  readonly sessionId: string;
  readonly materialId: string;
  readonly dilutionId: string | null;
  readonly fraction: Ratio | null;
  readonly solvent: string | null;
  readonly dose: string | null;
  readonly appliedAt: string;
  readonly blindLabel: BlindLabel;
  readonly revealedAt: string | null;
  readonly closedAt: string | null;
}

/** What a tab holds besides its lists: one attribute per column (V3-41). */
export interface MomentFields {
  readonly text: string | null;
  readonly intensity: number | null;
  readonly texture: string | null;
  readonly temperature: string | null;
  readonly shape: string | null;
  readonly color: string | null;
  readonly brightness: string | null;
  readonly thingOrPlace: (typeof THING_OR_PLACE)[number] | null;
  readonly thingOrPlaceText: string | null;
  readonly ownField: string | null;
  readonly complexity: (typeof COMPLEXITY)[number] | null;
  readonly complexityNote: string | null;
  readonly puff: (typeof PUFF)[number] | null;
  readonly revisedImage: string | null;
  readonly metaphor: string | null;
  readonly notes: string | null;
  readonly nearDetectable: boolean | null;
  readonly farDetectable: boolean | null;
  readonly reviewed: readonly Block[];
}

export interface TastingMoment extends MomentFields {
  readonly id: string;
  readonly stripId: string;
  readonly moment: Moment;
  readonly at: string;
  /** The perceived families, by list: «calkin:floral», as scheme and code. */
  readonly families: readonly { readonly scheme: FamilyScheme; readonly code: string }[];
  readonly battery: ReadonlyMap<BatteryAxis, BatteryState>;
  /** The curve, segment (1-4) to level; a segment not drawn is absent. */
  readonly curve: ReadonlyMap<number, CurveLevel>;
}

export interface ClosureFields {
  readonly role: (typeof ROLES)[number] | null;
  readonly effectRichness: (typeof EFFECT_RICHNESS)[number] | null;
  readonly effectEnergy: (typeof EFFECT_ENERGY)[number] | null;
  readonly versatility: (typeof VERSATILITY)[number] | null;
  readonly decay: (typeof DECAY)[number] | null;
  readonly r1: (typeof R1)[number] | null;
  readonly r2: (typeof R2)[number] | null;
  readonly r2Note: string | null;
  readonly r3: (typeof R3)[number] | null;
  readonly r3Note: string | null;
  readonly biases: readonly (typeof BIASES)[number][];
  readonly biasNote: string | null;
  readonly affinities: string | null;
  readonly destination: string | null;
  readonly negativeDestination: string | null;
  readonly comparison: string | null;
}

export interface TastingClosure extends ClosureFields {
  readonly id: string;
  readonly stripId: string;
}

export interface Tastings {
  readonly sessions: readonly TastingSession[];
  readonly strips: readonly TastingStrip[];
  readonly moments: readonly TastingMoment[];
  readonly closures: readonly TastingClosure[];
  /** Materials marked in the queue, with why (V3-63). */
  readonly marks: ReadonlyMap<string, string>;
}

/** The tables of the tastings: when any changes, the tastings are read again. */
export const TASTING_TABLES = [
  "tasting_sessions", "tasting_strips", "tasting_moments", "tasting_families", "tasting_battery", "tasting_curve", "tasting_closures", "tasting_marks",
];

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const is = <T extends string | number>(list: readonly T[], value: unknown): value is T => (list as readonly unknown[]).includes(value);
function oneOf<T extends string | number>(list: readonly T[], value: unknown, what: string): T {
  if (!is(list, value)) throw new Error(`unknown ${what}: ${String(value)}`);
  return value;
}
const orNull = <T extends string>(list: readonly T[], value: unknown, what: string): T | null => (value === null || value === undefined ? null : oneOf(list, value, what));
const clean = (value: string | null | undefined) => (value?.trim() ? value : null);

export async function loadTastings(db: LocalDb, userId: string): Promise<Tastings> {
  const mine = <T extends { userId: unknown }>(t: T) => eq((t as unknown as typeof local.tastingSessions).userId, userId);
  const [sessions, strips, moments, families, battery, curve, closures, marks] = await Promise.all([
    db.select().from(local.tastingSessions).where(mine(local.tastingSessions)),
    db.select().from(local.tastingStrips).where(mine(local.tastingStrips)),
    db.select().from(local.tastingMoments).where(mine(local.tastingMoments)),
    db.select().from(local.tastingFamilies).where(mine(local.tastingFamilies)),
    db.select().from(local.tastingBattery).where(mine(local.tastingBattery)),
    db.select().from(local.tastingCurve).where(mine(local.tastingCurve)),
    db.select().from(local.tastingClosures).where(mine(local.tastingClosures)),
    db.select().from(local.tastingMarks).where(mine(local.tastingMarks)),
  ]);
  return {
    sessions: sessions
      .map((s) => ({ id: s.id, startedAt: s.startedAt ?? "", endedAt: s.endedAt, note: s.note }))
      .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1)),
    strips: strips
      .map((s) => ({
        id: s.id,
        sessionId: s.sessionId ?? "",
        materialId: s.materialId ?? "",
        dilutionId: s.dilutionId,
        fraction: ratioFromNumeric(s.fraction),
        solvent: s.solvent,
        dose: s.dose,
        appliedAt: s.appliedAt ?? "",
        blindLabel: oneOf(BLIND_LABELS, s.blindLabel, "blind label"),
        revealedAt: s.revealedAt,
        closedAt: s.closedAt,
      }))
      .sort((a, b) => (a.blindLabel < b.blindLabel ? -1 : 1)),
    moments: moments.map((m) => ({
      id: m.id,
      stripId: m.stripId ?? "",
      moment: oneOf(MOMENTS, m.moment, "moment"),
      at: m.at ?? "",
      text: m.text,
      intensity: m.intensity,
      texture: m.texture,
      temperature: m.temperature,
      shape: m.shape,
      color: m.color,
      brightness: m.brightness,
      thingOrPlace: orNull(THING_OR_PLACE, m.thingOrPlace, "thing or place"),
      thingOrPlaceText: m.thingOrPlaceText,
      ownField: m.ownField,
      complexity: orNull(COMPLEXITY, m.complexity, "complexity"),
      complexityNote: m.complexityNote,
      puff: orNull(PUFF, m.puff, "puff"),
      revisedImage: m.revisedImage,
      metaphor: m.metaphor,
      notes: m.notes,
      nearDetectable: m.nearDetectable,
      farDetectable: m.farDetectable,
      reviewed: (m.reviewed ?? []).filter((b): b is Block => is(BLOCKS, b)),
      families: families.filter((f) => f.momentId === m.id).map((f) => ({ scheme: oneOf(FAMILY_SCHEMES, f.scheme, "family list"), code: f.code ?? "" })),
      battery: new Map(battery.filter((b) => b.momentId === m.id).map((b) => [oneOf(BATTERY_AXES, b.axis, "axis"), oneOf(BATTERY_STATES, b.state, "state")])),
      curve: new Map(curve.filter((c) => c.momentId === m.id).map((c) => [Number(c.segment), oneOf(CURVE_LEVELS, c.level, "curve level")])),
    })),
    closures: closures.map((c) => ({
      id: c.id,
      stripId: c.stripId ?? "",
      role: orNull(ROLES, c.role, "role"),
      effectRichness: orNull(EFFECT_RICHNESS, c.effectRichness, "effect"),
      effectEnergy: orNull(EFFECT_ENERGY, c.effectEnergy, "effect"),
      versatility: orNull(VERSATILITY, c.versatility, "versatility"),
      decay: orNull(DECAY, c.decay, "decay"),
      r1: orNull(R1, c.r1, "R1"),
      r2: orNull(R2, c.r2, "R2"),
      r2Note: c.r2Note,
      r3: orNull(R3, c.r3, "R3"),
      r3Note: c.r3Note,
      biases: (c.biases ?? []).filter((b): b is (typeof BIASES)[number] => is(BIASES, b)),
      biasNote: c.biasNote,
      affinities: c.affinities,
      destination: c.destination,
      negativeDestination: c.negativeDestination,
      comparison: c.comparison,
    })),
    marks: new Map(marks.map((m) => [m.materialId ?? "", m.label ?? ""])),
  };
}

/**
 * The tabs being made: two touches in a row on a new tab (a text left, a button pressed) must make it
 * once, not twice. The copy has no unique keys of its own; Supabase's would refuse the second.
 */
const making = new Map<string, Promise<string>>();

async function ownSession(db: LocalDb, userId: string, sessionId: string) {
  const [row] = await db.select().from(local.tastingSessions).where(and(eq(local.tastingSessions.id, sessionId), eq(local.tastingSessions.userId, userId)));
  if (!row) throw new Error("not one of your tasting sessions");
  return row;
}

async function ownStrip(db: LocalDb, userId: string, stripId: string) {
  const [row] = await db.select().from(local.tastingStrips).where(and(eq(local.tastingStrips.id, stripId), eq(local.tastingStrips.userId, userId)));
  if (!row) throw new Error("not one of your strips");
  return row;
}

async function visibleMaterial(db: LocalDb, userId: string, materialId: string) {
  const [row] = await db.select().from(local.materials).where(eq(local.materials.id, materialId));
  if (!row || (row.ownerId !== null && row.ownerId !== userId)) throw new Error("a strip is of a common material or yours");
  return row;
}

export async function createSession(db: LocalDb, userId: string, note?: string | null): Promise<string> {
  const sessionId = id();
  const stamp = now();
  await db.insert(local.tastingSessions).values({ id: sessionId, userId, startedAt: stamp, endedAt: null, note: clean(note), createdAt: stamp, updatedAt: stamp });
  return sessionId;
}

export async function endSession(db: LocalDb, userId: string, sessionId: string): Promise<void> {
  await ownSession(db, userId, sessionId);
  await db.update(local.tastingSessions).set({ endedAt: now(), updatedAt: now() }).where(eq(local.tastingSessions.id, sessionId));
}

/** Deletes one of your sessions with all it holds: for a session started by mistake. */
export async function deleteSession(db: LocalDb, userId: string, sessionId: string): Promise<void> {
  await ownSession(db, userId, sessionId);
  const strips = await db.select().from(local.tastingStrips).where(eq(local.tastingStrips.sessionId, sessionId));
  const stripIds = strips.map((s) => s.id);
  if (stripIds.length > 0) {
    const moments = await db.select().from(local.tastingMoments).where(inArray(local.tastingMoments.stripId, stripIds));
    const momentIds = moments.map((m) => m.id);
    if (momentIds.length > 0) {
      await db.delete(local.tastingFamilies).where(inArray(local.tastingFamilies.momentId, momentIds));
      await db.delete(local.tastingBattery).where(inArray(local.tastingBattery.momentId, momentIds));
      await db.delete(local.tastingCurve).where(inArray(local.tastingCurve.momentId, momentIds));
    }
    await db.delete(local.tastingClosures).where(inArray(local.tastingClosures.stripId, stripIds));
  }
  // The strips, then the session: the server takes the tabs with them (t0 goes only with its strip).
  await db.delete(local.tastingStrips).where(eq(local.tastingStrips.sessionId, sessionId));
  await db.delete(local.tastingSessions).where(eq(local.tastingSessions.id, sessionId));
  if (stripIds.length > 0) await db.delete(local.tastingMoments).where(inArray(local.tastingMoments.stripId, stripIds));
}

/**
 * A strip in one of your sessions, under the first free blind label (A to D). Its fraction and solvent
 * are copied from your dilution, so that editing the bottle later does not change the tasting.
 */
/** Which bottle a strip is of (V3-66, V3-67): one of yours of that material, or the material pure; null while not chosen. */
export interface StripBottle {
  readonly dilutionId?: string | null;
  readonly pure?: boolean;
}

/**
 * What a strip copies of its bottle when it is made, so that correcting the bottle later does not
 * change the tasting: its exact fraction and its diluents in words. Pure is 1 and no diluent.
 */
async function bottleSnapshot(db: LocalDb, userId: string, materialId: string, bottle: StripBottle) {
  if (bottle.pure) return { dilutionId: null, fraction: "1", solvent: null };
  if (!bottle.dilutionId) return { dilutionId: null, fraction: null, solvent: null };
  const [dilution] = await db.select().from(local.labDilutions).where(and(eq(local.labDilutions.id, bottle.dilutionId), eq(local.labDilutions.userId, userId)));
  if (!dilution) throw new Error("not one of your dilutions");
  if (dilution.materialId !== materialId) throw new Error("the dilution is of another material");
  const diluents = (await db.select().from(local.labDilutionDiluents).where(eq(local.labDilutionDiluents.dilutionId, dilution.id))).sort(
    (a, b) => Number(a.position) - Number(b.position),
  );
  let solvent = dilution.solvent;
  if (diluents.length > 0) {
    const names = new Map((await db.select().from(local.materials).where(inArray(local.materials.id, diluents.map((d) => d.diluentId!)))).map((m) => [m.id, m.name ?? "—"]));
    solvent = diluents.map((d) => names.get(d.diluentId!) ?? "—").join(" y ");
  }
  return { dilutionId: dilution.id, fraction: dilution.fraction, solvent };
}

export async function addStrip(
  db: LocalDb,
  userId: string,
  sessionId: string,
  input: { readonly materialId: string; readonly dose?: string | null; readonly appliedAt?: string } & StripBottle,
): Promise<string> {
  await ownSession(db, userId, sessionId);
  await visibleMaterial(db, userId, input.materialId);
  const taken = new Set((await db.select().from(local.tastingStrips).where(eq(local.tastingStrips.sessionId, sessionId))).map((s) => s.blindLabel));
  const label = BLIND_LABELS.find((l) => !taken.has(l));
  if (!label) throw new Error("a session holds four strips at most");
  const { fraction, solvent } = await bottleSnapshot(db, userId, input.materialId, input);
  const stripId = id();
  const stamp = now();
  await db.insert(local.tastingStrips).values({
    id: stripId,
    sessionId,
    userId,
    materialId: input.materialId,
    dilutionId: input.pure ? null : (input.dilutionId ?? null),
    fraction,
    solvent,
    dose: clean(input.dose),
    appliedAt: input.appliedAt ?? stamp,
    blindLabel: label,
    revealedAt: null,
    closedAt: null,
    createdAt: stamp,
    updatedAt: stamp,
  });
  return stripId;
}

/** Changes the bottle of a strip before it is smelled (V3-66): once the opening is written, it stays. */
export async function setStripBottle(db: LocalDb, userId: string, stripId: string, bottle: StripBottle): Promise<void> {
  const strip = await ownStrip(db, userId, stripId);
  const moments = await db.select().from(local.tastingMoments).where(eq(local.tastingMoments.stripId, stripId));
  if (moments.length > 0) throw new Error("the bottle of a strip is fixed once it is smelled");
  const snap = await bottleSnapshot(db, userId, strip.materialId!, bottle);
  await db.update(local.tastingStrips).set({ ...snap, updatedAt: now() }).where(eq(local.tastingStrips.id, stripId));
}

/** Takes a strip out of its session, with all it holds, before anything was written on it but the opening. */
export async function removeStrip(db: LocalDb, userId: string, stripId: string): Promise<void> {
  await ownStrip(db, userId, stripId);
  const moments = await db.select().from(local.tastingMoments).where(eq(local.tastingMoments.stripId, stripId));
  if (moments.some((m) => m.moment !== "t0")) throw new Error("a strip with readings stays: close it instead");
  await db.delete(local.tastingStrips).where(eq(local.tastingStrips.id, stripId));
  await db.delete(local.tastingMoments).where(eq(local.tastingMoments.stripId, stripId));
}

/** The opening (t0), blind: written once and never corrected (V3-61). */
export function writeOpening(db: LocalDb, userId: string, stripId: string, text: string): Promise<string> {
  const key = `${userId}:${stripId}:t0`;
  if (making.has(key)) return Promise.reject(new Error("the opening (t0) is written once and never corrected"));
  const made = makeOpening(db, userId, stripId, text).finally(() => making.delete(key));
  making.set(key, made);
  return made;
}

async function makeOpening(db: LocalDb, userId: string, stripId: string, text: string): Promise<string> {
  const strip = await ownStrip(db, userId, stripId);
  if (text.trim() === "") throw new Error("an opening says something");
  if (strip.fraction === null) throw new Error("first the bottle (or pure), then the opening (V3-66)");
  const [existing] = await db.select().from(local.tastingMoments).where(and(eq(local.tastingMoments.stripId, stripId), eq(local.tastingMoments.moment, "t0")));
  if (existing) throw new Error("the opening (t0) is written once and never corrected");
  const momentId = id();
  const stamp = now();
  await db.insert(local.tastingMoments).values({ id: momentId, stripId, userId, moment: "t0", at: stamp, text, reviewed: [], createdAt: stamp, updatedAt: stamp });
  return momentId;
}

/** A tab after the opening, made the first time it is touched; empty, never a copy of the one before (V3-61). */
export function ensureMoment(db: LocalDb, userId: string, stripId: string, moment: Moment): Promise<string> {
  const key = `${userId}:${stripId}:${moment}`;
  const pending = making.get(key);
  if (pending) return pending;
  const made = makeMoment(db, userId, stripId, moment).finally(() => making.delete(key));
  making.set(key, made);
  return made;
}

async function makeMoment(db: LocalDb, userId: string, stripId: string, moment: Moment): Promise<string> {
  await ownStrip(db, userId, stripId);
  if (moment === "t0") throw new Error("the opening is written with writeOpening");
  oneOf(MOMENTS, moment, "moment");
  const written = await db.select().from(local.tastingMoments).where(eq(local.tastingMoments.stripId, stripId));
  const existing = written.find((m) => m.moment === moment);
  if (existing) return existing.id;
  if (!written.some((m) => m.moment === "t0")) throw new Error("first the opening (t0), then the breakdown");
  const momentId = id();
  const stamp = now();
  await db.insert(local.tastingMoments).values({ id: momentId, stripId, userId, moment, at: stamp, reviewed: [], createdAt: stamp, updatedAt: stamp });
  return momentId;
}

async function ownMoment(db: LocalDb, userId: string, momentId: string) {
  const [row] = await db.select().from(local.tastingMoments).where(and(eq(local.tastingMoments.id, momentId), eq(local.tastingMoments.userId, userId)));
  if (!row) throw new Error("not one of your tabs");
  if (row.moment === "t0") throw new Error("the opening (t0) is never corrected");
  return row;
}

/** Changes the fields of a tab after the opening; each change writes only its own fields. */
export async function updateMoment(db: LocalDb, userId: string, momentId: string, changes: Partial<MomentFields>): Promise<void> {
  await ownMoment(db, userId, momentId);
  if (changes.intensity !== undefined && changes.intensity !== null) {
    if (!Number.isInteger(changes.intensity) || changes.intensity < INTENSITY_MIN || changes.intensity > INTENSITY_MAX) throw new RangeError("an intensity is 1 to 5");
  }
  if (changes.thingOrPlace !== undefined) orNull(THING_OR_PLACE, changes.thingOrPlace, "thing or place");
  if (changes.complexity !== undefined) orNull(COMPLEXITY, changes.complexity, "complexity");
  if (changes.puff !== undefined) orNull(PUFF, changes.puff, "puff");
  for (const b of changes.reviewed ?? []) oneOf(BLOCKS, b, "block");
  const set: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) continue;
    set[key] = key === "reviewed" ? [...new Set(value as Block[])] : typeof value === "string" ? clean(value) : value;
  }
  await db.update(local.tastingMoments).set({ ...set, updatedAt: now() }).where(eq(local.tastingMoments.id, momentId));
}

/** Marks or unmarks a perceived family in a tab (several at once). */
export async function setFamily(db: LocalDb, userId: string, momentId: string, scheme: FamilyScheme, code: string, on: boolean): Promise<void> {
  await ownMoment(db, userId, momentId);
  oneOf(FAMILY_SCHEMES, scheme, "family list");
  oneOf(FAMILY_CODES[scheme], code, "family");
  const where = and(eq(local.tastingFamilies.momentId, momentId), eq(local.tastingFamilies.scheme, scheme), eq(local.tastingFamilies.code, code));
  const [existing] = await db.select().from(local.tastingFamilies).where(where);
  if (on && !existing) await db.insert(local.tastingFamilies).values({ id: id(), momentId, userId, scheme, code, createdAt: now() });
  if (!on && existing) await db.delete(local.tastingFamilies).where(eq(local.tastingFamilies.id, existing.id));
}

/** One axis of the battery: sí · — · ? · n/r. */
export async function setBattery(db: LocalDb, userId: string, momentId: string, axis: BatteryAxis, state: BatteryState): Promise<void> {
  await ownMoment(db, userId, momentId);
  oneOf(BATTERY_AXES, axis, "axis");
  oneOf(BATTERY_STATES, state, "state");
  const [existing] = await db.select().from(local.tastingBattery).where(and(eq(local.tastingBattery.momentId, momentId), eq(local.tastingBattery.axis, axis)));
  const stamp = now();
  if (existing) await db.update(local.tastingBattery).set({ state, updatedAt: stamp }).where(eq(local.tastingBattery.id, existing.id));
  else await db.insert(local.tastingBattery).values({ id: id(), momentId, userId, axis, state, createdAt: stamp, updatedAt: stamp });
}

/** One segment of the curve; null clears it. */
export async function setCurve(db: LocalDb, userId: string, momentId: string, segment: number, level: CurveLevel | null): Promise<void> {
  await ownMoment(db, userId, momentId);
  oneOf(CURVE_SEGMENTS as readonly number[], segment, "segment");
  if (level !== null) oneOf(CURVE_LEVELS, level, "curve level");
  const [existing] = await db.select().from(local.tastingCurve).where(and(eq(local.tastingCurve.momentId, momentId), eq(local.tastingCurve.segment, segment)));
  const stamp = now();
  if (level === null) {
    if (existing) await db.delete(local.tastingCurve).where(eq(local.tastingCurve.id, existing.id));
  } else if (existing) await db.update(local.tastingCurve).set({ level, updatedAt: stamp }).where(eq(local.tastingCurve.id, existing.id));
  else await db.insert(local.tastingCurve).values({ id: id(), momentId, userId, segment, level, createdAt: stamp, updatedAt: stamp });
}

/** Shows the material's name: only after the opening and the breakdown (t5), V3-61. */
export async function revealStrip(db: LocalDb, userId: string, stripId: string): Promise<void> {
  await ownStrip(db, userId, stripId);
  const moments = await db.select().from(local.tastingMoments).where(eq(local.tastingMoments.stripId, stripId));
  if (!moments.some((m) => m.moment === "t0") || !moments.some((m) => m.moment === "t5")) throw new Error("the name is shown after the opening and the breakdown (t5)");
  await db.update(local.tastingStrips).set({ revealedAt: now(), updatedAt: now() }).where(eq(local.tastingStrips.id, stripId));
}

const CLOSURE_LISTS = {
  role: ROLES, effectRichness: EFFECT_RICHNESS, effectEnergy: EFFECT_ENERGY, versatility: VERSATILITY, decay: DECAY, r1: R1, r2: R2, r3: R3,
} as const;

/** Writes the closing of a strip, the fixed part answered once (V3-61); the comparison waits for closeStrip. */
export async function saveClosure(db: LocalDb, userId: string, stripId: string, changes: Partial<ClosureFields>): Promise<void> {
  const strip = await ownStrip(db, userId, stripId);
  for (const [key, list] of Object.entries(CLOSURE_LISTS)) {
    const value = changes[key as keyof ClosureFields];
    if (value !== undefined) orNull(list as readonly string[], value, key);
  }
  for (const b of changes.biases ?? []) oneOf(BIASES, b, "bias");
  if (changes.comparison?.trim() && !strip.closedAt) throw new Error("the comparison with the sources comes after closing the series, never before");
  const set: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) continue;
    set[key] = key === "biases" ? [...new Set(value as string[])] : typeof value === "string" ? clean(value) : value;
  }
  const [existing] = await db.select().from(local.tastingClosures).where(eq(local.tastingClosures.stripId, stripId));
  const stamp = now();
  if (existing) await db.update(local.tastingClosures).set({ ...set, updatedAt: stamp }).where(eq(local.tastingClosures.id, existing.id));
  else await db.insert(local.tastingClosures).values({ id: id(), stripId, userId, biases: [], ...set, createdAt: stamp, updatedAt: stamp });
}

/** Closes the series of a strip: from now on the comparison with the sources can be written. */
export async function closeStrip(db: LocalDb, userId: string, stripId: string): Promise<void> {
  const strip = await ownStrip(db, userId, stripId);
  if (strip.closedAt) return;
  const moments = await db.select().from(local.tastingMoments).where(eq(local.tastingMoments.stripId, stripId));
  if (!moments.some((m) => m.moment === "t0")) throw new Error("a strip without its opening is not closed");
  const stamp = now();
  await db.update(local.tastingStrips).set({ closedAt: stamp, revealedAt: strip.revealedAt ?? stamp, updatedAt: stamp }).where(eq(local.tastingStrips.id, stripId));
}

/** Marks a material in the queue, with why («pedido 2026-10-18»), or unmarks it (null). */
export async function setMark(db: LocalDb, userId: string, materialId: string, label: string | null): Promise<void> {
  await visibleMaterial(db, userId, materialId);
  const [existing] = await db.select().from(local.tastingMarks).where(and(eq(local.tastingMarks.userId, userId), eq(local.tastingMarks.materialId, materialId)));
  if (existing) await db.delete(local.tastingMarks).where(eq(local.tastingMarks.id, existing.id));
  if (label?.trim()) await db.insert(local.tastingMarks).values({ id: id(), userId, materialId, label: label.trim(), createdAt: now() });
}
