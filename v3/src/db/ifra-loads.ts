import { Ratio } from "../core/arith/ratio";
import type { Authority, Component } from "./catalog";
import type { IfraStandard } from "./ifra-layer";

/**
 * How a material's figures turn into loads of IFRA's standards (src/db/to-ifra.ts): the ranks of the
 * authorities, what a component brings, and V3-113's readings of names, documents and scope.
 */

export const RANK: Readonly<Record<Authority, number>> = { lot: 0, product: 1, ifra: 2, literature: 3, consensus: 4 };
export const isPlaceholder = (authority: Authority) => authority === "literature" || authority === "consensus";
/** For comparing names and processes: no accents, no case. */
export const fold = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/** What a material brings of a member, as a fraction of its pure matter: known, or bounded by `upper`. */
export interface Load {
  readonly known: Ratio | null;
  readonly upper: Ratio;
}

export const scale = (load: Load, by: Load): Load => ({
  known: load.known && by.known ? load.known.mul(by.known) : null,
  upper: load.upper.mul(by.upper),
});

export const plus = (a: Load, b: Load): Load => ({
  known: a.known && b.known ? a.known.add(b.known) : null,
  upper: a.upper.add(b.upper),
});

export function loadOf(component: Component): Load {
  const amount = component.amount;
  if (amount.kind === "unknown") {
    return { known: null, upper: Ratio.ONE };
  }
  // A «max» or a «range» counts its top: the worst the source allows.
  const value = amount.kind === "range" ? amount.max : amount.value;
  return isPlaceholder(component.authority) ? { known: null, upper: value } : { known: value, upper: value };
}

/** A load less the part of it that is already counted elsewhere; null when nothing is left. */
export function less(load: Load, part: Load | undefined): Load | null {
  if (!part) return load;
  const upper = load.upper.sub(part.upper);
  if (upper.sign() <= 0) return null;
  return { known: load.known && part.known ? load.known.sub(part.known) : null, upper };
}

/** For a name of a component or a standard: no annex number of the EU («III/70»), no brackets, no «natural». */
export const cleanName = (text: string) =>
  fold(text)
    .replace(/\b(iii|annex iii)\s*\/\s*\d+\b/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\bnatural\b/g, " ")
    .replace(/[®™]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const EXPRESSED = /\b(expressed|cold[ -]pressed)$/;
const DISTILLED = /distil|destil|arrastre|steam|vapor|hydrodistill|rectif/;
const PEEL = /peel|piel|cascara|rind|zest|fruit|fruto/;
const NOT_PEEL = /leaf|leaves|hoja|flower|flor|petal|blossom|twig|ramita|root|raiz|seed|semilla|bud/;

/**
 * V3-113 (proposal): a standard of an expressed peel oil is about that oil. A member the data say is distilled,
 * or is another part of the plant and not the peel, is outside it. What the data do not say keeps it (§1.2).
 */
export function outsideScope(standard: IfraStandard, identity: { readonly process: string | null; readonly part?: string | null }): boolean {
  if (!EXPRESSED.test(fold(standard.name))) return false;
  const process = fold(identity.process ?? "");
  const part = fold(identity.part ?? "");
  if (process && DISTILLED.test(process) && !/express|presion|pressed/.test(process)) return true;
  return part !== "" && NOT_PEEL.test(part) && !PEEL.test(part);
}

/** The document a figure comes from: its source up to the quoted sentence, without the page. */
export const documentOf = (source: string) =>
  source
    .split("«")[0]
    .replace(/,?\s*(page|pages|página|p\.)\s*\d+.*$/i, "")
    .replace(/[\s,:;]+$/, "")
    .trim();

/**
 * V3-113 (proposal): the CAS whose figure does not count because another document already speaks for its
 * standard. By standard group: only the most authoritative rank stays, and within it the document whose
 * figures add up to the most; the others are what one document already said. A figure that waits for a
 * document (V3-27) takes no part. A CAS in several groups is dropped only when every group drops it.
 */
export function supersededBy(rows: ReadonlyArray<readonly [string, Component]>, groupsOfCas: (cas: string) => readonly string[]): string[] {
  const byGroup = new Map<string, Array<{ cas: string; c: Component }>>();
  for (const [cas, c] of rows) {
    if (c.id.startsWith("limit:")) continue;
    for (const g of new Set(groupsOfCas(cas))) byGroup.set(g, [...(byGroup.get(g) ?? []), { cas, c }]);
  }
  const kept = new Set<string>();
  const dropped = new Set<string>();
  for (const members of byGroup.values()) {
    const best = Math.min(...members.map((m) => RANK[m.c.authority]));
    const top = members.filter((m) => RANK[m.c.authority] === best);
    const docs = new Map<string, { sum: Ratio; cas: string[] }>();
    for (const m of top) {
      const doc = documentOf(m.c.source);
      const before = docs.get(doc) ?? { sum: Ratio.ZERO, cas: [] };
      docs.set(doc, { sum: before.sum.add(loadOf(m.c).upper), cas: [...before.cas, m.cas] });
    }
    const winner = [...docs.values()].reduce((a, b) => (b.sum.gt(a.sum) ? b : a));
    for (const m of members) (winner.cas.includes(m.cas) ? kept : dropped).add(m.cas);
  }
  return [...dropped].filter((cas) => !kept.has(cas));
}
