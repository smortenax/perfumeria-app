import type { IfraReport } from "../core/ifra";

/**
 * A formula's IFRA as one label (F20, V3-78), from reading 1 of its report (§5.4): over, partial,
 * within at worst (bounded), within; and «empty» with nothing aromatic in it. What is not known is
 * never within: an unchecked material or constituent makes it partial (§5.5).
 */
export type IfraLabel = "exceeds" | "partial" | "bounded" | "within" | "empty";

export function ifraLabel(report: Pick<IfraReport, "asIs" | "partial" | "checks" | "unchecked" | "pending">, hasAromatic: boolean): IfraLabel {
  if (!hasAromatic) return "empty";
  if (report.asIs === "no") return "exceeds";
  if (report.asIs === "unknown" || report.partial || report.unchecked.length > 0 || report.pending.length > 0) return "partial";
  return report.checks.some((c) => c.verdict === "bounded") ? "bounded" : "within";
}

/** The ones Home warns about: over first, then partial. */
export const WARN: readonly IfraLabel[] = ["exceeds", "partial"];
