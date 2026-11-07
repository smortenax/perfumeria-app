import { Ratio } from "../core/arith/ratio";
import { numericFromRatio } from "../db/exact";
import { SHAPE_IDS, type ShapeId } from "./profile";

/**
 * A plan as a file (V3-100, format approved by the user on 2026-11-06): what is designed outside the
 * app (a golden split, a session's proposal) comes in as relative parts of pure material, and a plan of
 * the app goes out the same way. One JSON object; parts are exact decimal text, never a float. Reading
 * matches nothing: it says what each line asks for and what is wrong with it, and the review screen
 * finds the materials.
 */
export const PLAN_FORMAT = "perfumeria/plan/1";
export const PARTS_BASIS = "pure material, relative";

/** What is wrong with one line: it is shown in grey and not imported. */
export type LineProblem = "no-material" | "parts" | "shape";

export interface PlanFileLine {
  /** 1 for the first line of the file. */
  readonly index: number;
  readonly material: string;
  readonly materialId: string | null;
  readonly cas: string | null;
  /** Exact; null when the text is not a decimal above 0. */
  readonly parts: Ratio | null;
  /** null: the material's default. */
  readonly shape: ShapeId | null;
  readonly group: string | null;
  readonly problem: LineProblem | null;
}

export interface PlanFile {
  readonly name: string | null;
  readonly created: string | null;
  readonly source: string | null;
  readonly lines: readonly PlanFileLine[];
}

/** Why a whole file is refused. */
export type FileProblem = "not-json" | "not-a-plan" | "unknown-format" | "no-lines";

export type PlanRead = { readonly ok: true; readonly plan: PlanFile } | { readonly ok: false; readonly problem: FileProblem; readonly format?: string };

const text = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const DECIMAL = /^\d+(?:\.\d+)?$/;

/** Reads a plan file. A format it does not know is refused whole, as with formulas (§1.2). */
export function planFromJson(json: string): PlanRead {
  let doc: unknown;
  try {
    doc = JSON.parse(json);
  } catch {
    return { ok: false, problem: "not-json" };
  }
  if (!isObject(doc) || typeof doc.format !== "string") return { ok: false, problem: "not-a-plan" };
  if (doc.format !== PLAN_FORMAT) return { ok: false, problem: "unknown-format", format: doc.format };
  if (!Array.isArray(doc.lines) || doc.lines.length === 0) return { ok: false, problem: "no-lines" };
  const lines = doc.lines.map((raw: unknown, i): PlanFileLine => {
    const l = isObject(raw) ? raw : {};
    const material = text(l.material) ?? "";
    // A float (13.63 without quotes) is refused, not rounded: the file must say the exact figure.
    const partsText = typeof l.parts === "string" ? l.parts.trim() : null;
    const parts = partsText !== null && DECIMAL.test(partsText) ? Ratio.fromDecimal(partsText) : null;
    const shapeOk = l.shape === undefined || l.shape === null || (typeof l.shape === "string" && (SHAPE_IDS as readonly string[]).includes(l.shape));
    const problem: LineProblem | null = !material ? "no-material" : parts === null || parts.isZero() ? "parts" : !shapeOk ? "shape" : null;
    return {
      index: i + 1,
      material,
      materialId: text(l.materialId),
      cas: text(l.cas),
      parts: parts && !parts.isZero() ? parts : null,
      shape: shapeOk && typeof l.shape === "string" ? (l.shape as ShapeId) : null,
      group: text(l.group),
      problem,
    };
  });
  return { ok: true, plan: { name: text(doc.name), created: text(doc.created), source: text(doc.source), lines } };
}

export interface PlanOutLine {
  readonly material: string;
  readonly materialId: string;
  readonly cas: string | null;
  readonly parts: Ratio;
  readonly shape: ShapeId | null;
  readonly group: string | null;
}

/** Writes a plan of the app as a file, so it can go to the lab's repository and come back. */
export function planToJson(plan: { readonly name: string; readonly created: string; readonly source?: string | null; readonly lines: readonly PlanOutLine[] }): string {
  const doc = {
    format: PLAN_FORMAT,
    name: plan.name,
    created: plan.created,
    ...(plan.source ? { source: plan.source } : {}),
    partsBasis: PARTS_BASIS,
    lines: plan.lines.map((l) => ({
      material: l.material,
      materialId: l.materialId,
      ...(l.cas ? { cas: l.cas } : {}),
      parts: numericFromRatio(l.parts),
      shape: l.shape,
      ...(l.group ? { group: l.group } : {}),
    })),
  };
  return `${JSON.stringify(doc, null, 2)}\n`;
}
