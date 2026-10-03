import { Ratio } from "../core/arith/ratio";
import type { IfraBase, IfraReport, Verdict } from "../core/ifra";
import { readingIn, substanceRows, type SubstanceRow } from "./ifra-panel";

/**
 * What the IFRA panel says to explain a «no» or a «no se sabe» (Phase 5): the substances over their ceiling and who brings
 * them, the group of phototoxics with its members and the sum of their quotients, and what is unknown, apart by kind.
 * Pure over the report; nothing is calculated that the engine did not.
 */

/**
 * The key by which the adapter tells the kind of a pending entry: the report names the material and the text, and the adapter
 * (`buildIfra`, `MaterialDetail.specPending`) knows which of its pendings are specifications to prove when it makes them.
 */
export const pendingKey = (material: string, text: string): string => `${material}\u0000${text}`;

/** The `pendingKey`s of every specification the adapter left pending, for the whole repository. */
export function specificationKeys(
  details: ReadonlyMap<string, { readonly specPending: readonly string[] }> | undefined,
  nameOf: (key: string) => string | undefined,
): Set<string> {
  const keys = new Set<string>();
  for (const [key, detail] of details ?? []) {
    for (const text of detail.specPending) {
      keys.add(pendingKey(nameOf(key) ?? key, text));
    }
  }
  return keys;
}

export interface PendingSplit {
  /** «No se sabe por cantidades»: how much of a regulated substance the material carries is not known. */
  readonly quantities: ReadonlyArray<{ readonly material: string; readonly text: string }>;
  /** «Especificaciones por acreditar»: IFRA asks for a property (peroxides, free allyl alcohol…) that nobody has proven. */
  readonly specifications: ReadonlyArray<{ readonly material: string; readonly text: string }>;
}

export function splitPending(report: IfraReport, specifications: ReadonlySet<string>): PendingSplit {
  const isSpec = (p: { material: string; text: string }) => specifications.has(pendingKey(p.material, p.text));
  return { quantities: report.pending.filter((p) => !isSpec(p)), specifications: report.pending.filter(isSpec) };
}

export interface GroupMember {
  readonly key: string;
  readonly name: string;
  readonly limit: Ratio;
  /** The substance's share over its own ceiling: what it alone uses of the group's 1. */
  readonly knownQuotient: Ratio;
  readonly worstQuotient: Ratio;
}

/** A group summed against its ceilings (STD 089): its members in the bottle and the sum of their quotients, 1 being the ceiling. */
export interface GroupRow {
  readonly group: string;
  readonly verdict: Verdict;
  readonly members: readonly GroupMember[];
  readonly knownSum: Ratio;
  readonly worstSum: Ratio;
}

export function groupRows(report: IfraReport, base?: IfraBase): GroupRow[] {
  const reading = readingIn(report, base);
  const rows = new Map(substanceRows(report, base).map((r) => [r.key, r]));
  return report.combinedChecks.map((check) => {
    const members = check.keys.flatMap((key): GroupMember[] => {
      const row = rows.get(key);
      if (!row || row.limit.isZero()) {
        return [];
      }
      return [{ key, name: row.name, limit: row.limit, knownQuotient: row.knownShare.div(row.limit), worstQuotient: row.worstShare.div(row.limit) }];
    });
    return {
      group: check.group,
      verdict: reading.combined.find((c) => c.group === check.group)?.verdict ?? check.verdict,
      members,
      knownSum: Ratio.sum(members.map((m) => m.knownQuotient)),
      worstSum: Ratio.sum(members.map((m) => m.worstQuotient)),
    };
  });
}

export interface Why {
  /** The substances over their ceiling, the worst first, each with the materials that bring it. */
  readonly exceeds: readonly SubstanceRow[];
  /** The groups over 1. */
  readonly groupsOver: readonly GroupRow[];
  /** Materials with no IFRA data. */
  readonly unchecked: readonly string[];
  readonly pending: PendingSplit;
}

export function whyOf(report: IfraReport, specifications: ReadonlySet<string>, base?: IfraBase): Why {
  return {
    exceeds: substanceRows(report, base).filter((r) => r.verdict === "exceeds"),
    groupsOver: groupRows(report, base).filter((g) => g.verdict === "exceeds"),
    unchecked: report.unchecked,
    pending: splitPending(report, specifications),
  };
}
