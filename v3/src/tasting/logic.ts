import { Ratio } from "../core/arith/ratio";
import type { Catalog, Dilution } from "../db/catalog";
import type { TastingMoment, TastingStrip, Tastings } from "../db/tastings";
import { type Block, MOMENT_MINUTES, type Moment } from "./vocabulary";

/**
 * What the tastings screen works out from your data (V3-61 to V3-63): when each tab is due, what a
 * block of a tab says (data, «the same» or no data), the tenacity in hours and the queue.
 */

export type DueState = "done" | "due" | "waiting";

export interface DueMoment {
  readonly moment: Moment;
  readonly dueAt: number;
  readonly state: DueState;
}

/** Each tab of a strip with its time: done if written, due once its minute has come, waiting before. */
export function dueMoments(strip: Pick<TastingStrip, "appliedAt">, written: readonly Moment[], moments: readonly Moment[], nowMs: number): DueMoment[] {
  const applied = Date.parse(strip.appliedAt);
  return moments.map((moment) => {
    const dueAt = applied + MOMENT_MINUTES[moment] * 60_000;
    return { moment, dueAt, state: written.includes(moment) ? "done" : nowMs >= dueAt ? "due" : "waiting" };
  });
}

/** The next tab still to come of a strip, for its timer: null when none is waiting. */
export function nextWaiting(due: readonly DueMoment[]): DueMoment | null {
  return due.filter((d) => d.state === "waiting").sort((a, b) => a.dueAt - b.dueAt)[0] ?? null;
}

/** «4:59», «1 h 05», «2 d»: how long until a time, for a timer. */
export function countdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s >= 2 * 86400) return `${Math.floor(s / 86400)} d`;
  if (s >= 3600) return `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}`;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Whether a block of a tab has something written in it. */
function hasData(m: TastingMoment, block: Block): boolean {
  const some = (...values: unknown[]) => values.some((v) => v !== null && v !== undefined && v !== "");
  switch (block) {
    case "description":
      return some(m.text);
    case "thing_or_place":
      return some(m.thingOrPlace, m.thingOrPlaceText, m.ownField);
    case "intensity":
      return some(m.intensity, m.nearDetectable, m.farDetectable);
    case "curve":
      return m.curve.size > 0;
    case "synesthetic":
      return some(m.texture, m.temperature, m.shape, m.color, m.brightness);
    case "families":
      return m.families.length > 0;
    case "battery":
      return [...m.battery.values()].some((s) => s !== "nr");
    case "form":
      return some(m.complexity, m.complexityNote, m.puff);
  }
}

/**
 * What a block of a tab says (V3-61, the log's rule): written in it, «data»; marked as reviewed and
 * left empty, «same» (as before); untouched, «none» (no data, never «no»).
 */
export function blockState(m: TastingMoment | undefined, block: Block): "data" | "same" | "none" {
  if (!m) return "none";
  if (hasData(m, block)) return "data";
  return m.reviewed.includes(block) ? "same" : "none";
}

export interface Tenacity {
  readonly hours: Ratio;
  /** True when the last tab still noticed it: the strip lasts at least this long. */
  readonly atLeast: boolean;
}

/**
 * The tenacity, in hours (V3-42), from the strip's tabs (V3-62): the last tab still noticed close up.
 * If a later tab no longer notices it, the tenacity is between the two and the earlier one is given;
 * if none says no, it is «at least». Null when no tab answered the question.
 */
export function tenacity(strip: Pick<TastingStrip, "appliedAt">, moments: readonly TastingMoment[]): Tenacity | null {
  const applied = Date.parse(strip.appliedAt);
  const answered = moments.filter((m) => m.nearDetectable !== null).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  if (answered.length === 0) return null;
  const lastYes = [...answered].reverse().find((m) => m.nearDetectable === true);
  if (!lastYes) return { hours: Ratio.ZERO, atLeast: false };
  const after = answered.filter((m) => Date.parse(m.at) > Date.parse(lastYes.at));
  const ms = BigInt(Math.max(0, Date.parse(lastYes.at) - applied));
  return { hours: Ratio.of(ms, 3_600_000n), atLeast: !after.some((m) => m.nearDetectable === false) };
}

/** A tab compared with another: the blocks whose answer changed (V3-61, compare two times). */
export function changedBlocks(a: TastingMoment | undefined, b: TastingMoment | undefined, blocks: readonly Block[]): Block[] {
  const sig = (m: TastingMoment | undefined, block: Block) => {
    if (!m || blockState(m, block) !== "data") return "";
    switch (block) {
      case "description":
        return m.text ?? "";
      case "thing_or_place":
        return [m.thingOrPlace, m.thingOrPlaceText, m.ownField].join("|");
      case "intensity":
        return [m.intensity, m.nearDetectable, m.farDetectable].join("|");
      case "curve":
        return [...m.curve].sort().join("|");
      case "synesthetic":
        return [m.texture, m.temperature, m.shape, m.color, m.brightness].join("|");
      case "families":
        return m.families.map((f) => `${f.scheme}:${f.code}`).sort().join("|");
      case "battery":
        return [...m.battery].sort().join("|");
      case "form":
        return [m.complexity, m.complexityNote, m.puff].join("|");
    }
  };
  return blocks.filter((block) => blockState(b, block) === "data" && sig(a, block) !== sig(b, block));
}

// The queue (V3-63).

/** Legacy: the lab's sheet said it was tasted («catado», «catado (serie parcial)»). */
export const legacyTasted = (status: string | null | undefined) => /^catado/i.test(status?.trim() ?? "");

export interface QueueItem {
  readonly materialId: string;
  readonly name: string;
  readonly dilution: Dilution | null;
  readonly mark: string | null;
}

export interface QueueGroup {
  /** The nominal dilution and solvent («10 % · DPG»); null for the materials without a dilution of yours. */
  readonly key: string | null;
  readonly fraction: Ratio | null;
  readonly solvent: string | null;
  readonly items: readonly QueueItem[];
}

export interface Queue {
  readonly groups: readonly QueueGroup[];
  /** Of your materials: tasted (a strip closed in the app, or the lab's sheet), and pending. */
  readonly tasted: number;
  readonly pending: number;
  readonly marked: readonly QueueItem[];
}

/** The dilution a strip of this material is made from: the newest you made. */
export function latestDilution(dilutions: readonly Dilution[] | undefined): Dilution | null {
  if (!dilutions || dilutions.length === 0) return null;
  return [...dilutions].sort((a, b) => (b.madeOn ?? "").localeCompare(a.madeOn ?? ""))[0];
}

const solventKey = (s: string | null) => (s ?? "").trim().toLowerCase();

/** The usual strengths of a dilution, in percent: a weighed 9,98 % is a «10 %» bottle. */
const NOMINAL_PERCENTS = [0.01, 0.1, 0.5, 1, 2, 3, 5, 10, 15, 20, 25, 30, 50, 100];

/**
 * The strength a weighed dilution was made for, to group bottles alike: the usual one within 15 %
 * of it (9,98 % and 10,05 % are «10 %»), else the fraction as it is. Only for grouping: each
 * strip keeps the exact fraction of its bottle.
 */
export function nominalFraction(fraction: Ratio): Ratio {
  const percent = Number(fraction.toFixed(6)) * 100;
  const near = NOMINAL_PERCENTS.find((p) => Math.abs(percent - p) <= p * 0.15);
  return near === undefined ? fraction : Ratio.fromDecimal(String(near)).div(Ratio.of(100n));
}

/**
 * The queue (V3-63, widened by the user on 2026-10-19): every material of yours, not only what you
 * marked as «lo tengo», that you have not tasted, grouped by solvent and dilution, so that a
 * session takes strips alike in both (the lab's tasting plan); the marked ones first.
 */
export function buildQueue(catalog: Catalog, tastings: Pick<Tastings, "strips" | "marks">): Queue {
  const closed = new Set(tastings.strips.filter((s) => s.closedAt).map((s) => s.materialId));
  const isTasted = (id: string) => closed.has(id) || legacyTasted(catalog.evaluations.get(id)?.status);
  const yours = [...catalog.materials.values()].filter((m) => m.ownerId !== null).map((m) => m.id);
  const pending = yours.filter((id) => !isTasted(id));
  const items = pending
    .map((id): QueueItem => ({ materialId: id, name: catalog.materials.get(id)!.name, dilution: latestDilution(catalog.dilutions.get(id)), mark: tastings.marks.get(id) ?? null }))
    .sort((a, b) => (a.mark ? 0 : 1) - (b.mark ? 0 : 1) || a.name.localeCompare(b.name, "es"));
  const groups = new Map<string, { fraction: Ratio | null; solvent: string | null; items: QueueItem[] }>();
  for (const item of items) {
    const nominal = item.dilution ? nominalFraction(item.dilution.fraction) : null;
    const key = item.dilution && nominal ? `${nominal.toString()}|${solventKey(item.dilution.solvent)}` : "";
    const group = groups.get(key) ?? { fraction: nominal, solvent: item.dilution?.solvent ?? null, items: [] };
    group.items.push(item);
    groups.set(key, group);
  }
  const ordered = [...groups.entries()]
    .map(([key, g]): QueueGroup => ({ key: key === "" ? null : key, fraction: g.fraction, solvent: g.solvent, items: g.items }))
    .sort((a, b) => (a.key === null ? 1 : 0) - (b.key === null ? 1 : 0) || b.items.length - a.items.length);
  return { groups: ordered, tasted: yours.length - pending.length, pending: pending.length, marked: items.filter((i) => i.mark) };
}
