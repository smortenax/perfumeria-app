import { Ratio } from "../core/arith/ratio";
import type { BaseReading, IfraBase, IfraReport, Verdict } from "../core/ifra";

/**
 * The reading of the report in one base (P58). A base the header does not have falls back to the
 * base of the report: the switch of the panel can outlive a change of the header.
 */
export function readingIn(report: IfraReport, base?: IfraBase): BaseReading {
  return (
    report.readings.find((r) => r.base === base) ??
    report.readings.find((r) => r.base === report.base) ??
    report.readings[report.readings.length - 1]
  );
}

/** What one material brings of one substance, as a share of the product in the base. */
export interface SourceShare {
  readonly key: string;
  readonly name: string;
  readonly knownShare: Ratio;
  readonly worstShare: Ratio;
  /** Of the substance in the worst case, what this material brings. */
  readonly part: Ratio;
}

/** One substance of the panel (§5.4, §10.3): its CAS, its ceiling, where it stands and what still fits. */
export interface SubstanceRow {
  readonly key: string;
  readonly name: string;
  readonly cas: readonly string[];
  readonly limit: Ratio;
  readonly knownShare: Ratio;
  readonly worstShare: Ratio;
  /** The worst case over the ceiling; null for a prohibited substance that is there: past any ceiling. */
  readonly used: Ratio | null;
  readonly verdict: Verdict;
  /** What still fits of the substance poured pure, in µg (`BaseReading.roomUg`); null: no ceiling can be reached. */
  readonly roomUg: Ratio | null;
  readonly sources: readonly SourceShare[];
}

/** Prohibited first, then the closest to its ceiling: the panel is read from the top. */
function closerFirst(a: Ratio | null, b: Ratio | null): number {
  if (a === null || b === null) {
    return a === b ? 0 : a === null ? -1 : 1;
  }
  return b.cmp(a);
}

/**
 * The substances of the report in one base (P58), the closest to its ceiling first. Every share is
 * over what that base divides by (`BaseReading.finalUg`); the verdict and the room are the base's.
 */
export function substanceRows(report: IfraReport, base?: IfraBase): SubstanceRow[] {
  return rowsOf(report.checks, readingIn(report, base));
}

/**
 * The manufacturers' ceilings of the report (P62), as `substanceRows` gives IFRA's: in the base of the
 * switch, the closest to its ceiling first, with what each material brings.
 */
export function supplierRows(report: IfraReport, base?: IfraBase): SubstanceRow[] {
  const at = readingIn(report, base);
  const reading = report.supplierReadings.find((r) => r.base === at.base) ?? report.supplierReadings[report.supplierReadings.length - 1];
  return reading ? rowsOf(report.supplierChecks, reading) : [];
}

function rowsOf(checks: IfraReport["checks"], reading: BaseReading): SubstanceRow[] {
  const over = (ug: Ratio) => (reading.finalUg.isZero() ? Ratio.ZERO : ug.div(reading.finalUg));
  const rows = checks.map((check, i): SubstanceRow => {
    const { substance } = check;
    const worstShare = over(check.worstUg);
    const own = reading.checks[i];
    return {
      key: substance.key,
      name: substance.name,
      cas: substance.cas ?? [],
      limit: substance.limit,
      knownShare: over(check.knownUg),
      worstShare,
      used: substance.limit.isZero() ? (check.worstUg.isZero() ? Ratio.ZERO : null) : worstShare.div(substance.limit),
      verdict: own.verdict,
      roomUg: own.roomUg,
      sources: check.sources
        .filter((s) => !s.worstUg.isZero())
        .map((s) => ({
          key: s.material.key,
          name: s.material.name,
          knownShare: over(s.knownUg),
          worstShare: over(s.worstUg),
          part: check.worstUg.isZero() ? Ratio.ZERO : s.worstUg.div(check.worstUg),
        })),
    };
  });
  return rows.sort((a, b) => closerFirst(a.used, b.used));
}

/** One material of the panel seen by material (§5.4): what it uses of each ceiling it loads. */
export interface MaterialRow {
  readonly key: string;
  readonly name: string;
  /** The ceilings it adds to, the one it uses most first. */
  readonly items: ReadonlyArray<{
    readonly key: string;
    readonly name: string;
    readonly limit: Ratio;
    /** What this material alone puts of the ceiling, in the worst case; null for a prohibited substance. */
    readonly used: Ratio | null;
    readonly worstShare: Ratio;
    /** What the substance carries in all, from every material: whether the ceiling is at stake. */
    readonly verdict: Verdict;
  }>;
}

/**
 * The same substances seen by material (§5.4): for each material that brings any, what it alone
 * uses of every ceiling, in the base. The material that uses most of a ceiling first.
 */
export function materialRows(report: IfraReport, base?: IfraBase): MaterialRow[] {
  const rows = new Map<string, { key: string; name: string; items: Array<MaterialRow["items"][number]> }>();
  for (const row of substanceRows(report, base)) {
    for (const source of row.sources) {
      const entry = rows.get(source.key) ?? { key: source.key, name: source.name, items: [] };
      entry.items.push({
        key: row.key,
        name: row.name,
        limit: row.limit,
        used: row.limit.isZero() ? null : source.worstShare.div(row.limit),
        worstShare: source.worstShare,
        verdict: row.verdict,
      });
      rows.set(source.key, entry);
    }
  }
  const out = [...rows.values()].map((r) => ({ ...r, items: r.items.sort((a, b) => closerFirst(a.used, b.used)) }));
  return out.sort((a, b) => closerFirst(a.items[0].used, b.items[0].used));
}
