import type { Ratio } from "../core/arith/ratio";
import { ratioFromNumeric } from "./exact";
import * as local from "./local/schema";
import type { LocalDb } from "./materials";

/**
 * IFRA's layer as the app reads it (V3-35): the standards with their limits by category, the CAS
 * each one regulates, and what the annex says each natural brings. It lives apart from the
 * materials; the adapter reads a material (its CAS, its composition) against it.
 */

export type IfraLimitKind = "max" | "prohibited";

/** A standard's limit in one category: a fraction of the finished product, or a prohibition. */
export interface IfraLimit {
  readonly kind: IfraLimitKind;
  readonly maxValue: Ratio | null;
}

/** V3-31: which variant a material is, by its species or its process. */
export interface IfraVariantRule {
  readonly field: "species" | "process";
  readonly match: "contains" | "starts";
  readonly pattern: string;
  readonly variant: "prohibited" | "permitted";
}

export interface IfraStandard {
  readonly code: string;
  readonly name: string;
  readonly amendment: string;
  readonly type: string;
  readonly prohibition: boolean;
  readonly restriction: boolean;
  readonly specification: boolean;
  /** V3-30: prohibited as an ingredient, limited in the naturals that bring it. */
  readonly prohibitedAsSuch: boolean;
  /** The members that add up against one ceiling: the standard, or «furocumarinas» (V3-27). */
  readonly groupKey: string;
  /** V3-27: the limit is of this constituent in the finished product (STD 089: 5-MOP). */
  readonly limitExpressedAs: string | null;
  readonly limitExpressedAsCas: string | null;
  readonly prohibitionNote: string | null;
  readonly specificationNote: string | null;
  readonly property: string | null;
  /** By IFRA's category of use: «4», «5A»… */
  readonly limits: ReadonlyMap<string, IfraLimit>;
  readonly substances: readonly { readonly cas: string; readonly subgroup: string | null; readonly synonyms: readonly string[] }[];
  readonly variantRules: readonly IfraVariantRule[];
  /** The processes the standard's specification is not about (the resinoid of STD 078). */
  readonly specExclusions: readonly { readonly process: string; readonly note: string }[];
}

/** One row of IFRA's annex: what a natural brings of a regulated constituent, as a fraction of the natural. */
export interface IfraAnnexEntry {
  /** Its principal CAS; null when IFRA gives only other CAS. */
  readonly naturalCas: string | null;
  readonly naturalOtherCas: readonly string[];
  readonly naturalName: string;
  readonly botanicalName: string | null;
  readonly constituentCas: string | null;
  readonly constituentName: string;
  readonly concentration: Ratio;
  readonly constituentStandard: string | null;
  readonly notice: string | null;
}

export interface IfraLayer {
  /** By IFRA's reference: «IFRA_STD_154». */
  readonly standards: ReadonlyMap<string, IfraStandard>;
  /** The standards that regulate each CAS. */
  readonly byCas: ReadonlyMap<string, readonly string[]>;
  readonly annex: readonly IfraAnnexEntry[];
}

/** The rows of the layer, as the copy keeps them. */
export interface IfraRows {
  readonly standards: readonly (typeof local.ifraStandards.$inferSelect)[];
  readonly limits: readonly (typeof local.ifraLimits.$inferSelect)[];
  readonly substances: readonly (typeof local.ifraSubstances.$inferSelect)[];
  readonly annex: readonly (typeof local.ifraAnnex.$inferSelect)[];
  readonly variantRules: readonly (typeof local.ifraVariantRules.$inferSelect)[];
  readonly specExclusions: readonly (typeof local.ifraSpecExclusions.$inferSelect)[];
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[], what: string): T {
  if (value !== null && (allowed as readonly string[]).includes(value)) return value as T;
  throw new Error(`Unknown ${what}: ${value}`);
}

function exact(text: string | null, what: string): Ratio {
  const value = ratioFromNumeric(text);
  if (value === null) throw new Error(`Missing ${what}`);
  return value;
}

const byStandard = <T extends { readonly standardId: string | null }>(rows: readonly T[]) => {
  const out = new Map<string, T[]>();
  for (const row of rows) if (row.standardId) out.set(row.standardId, [...(out.get(row.standardId) ?? []), row]);
  return out;
};

/** The layer from its rows: pure, so that it is tested without a database. */
export function buildIfraLayer(rows: IfraRows): IfraLayer {
  const limits = byStandard(rows.limits);
  const substances = byStandard(rows.substances);
  const rules = byStandard(rows.variantRules);
  const exclusions = byStandard(rows.specExclusions);
  const standards = new Map<string, IfraStandard>();
  const byCas = new Map<string, string[]>();
  for (const s of rows.standards) {
    const code = s.code ?? "";
    const own = substances.get(s.id) ?? [];
    standards.set(code, {
      code,
      name: s.name ?? "",
      amendment: s.amendment ?? "",
      type: s.type ?? "",
      prohibition: s.prohibition ?? false,
      restriction: s.restriction ?? false,
      specification: s.specification ?? false,
      prohibitedAsSuch: s.prohibitedAsSuch ?? false,
      groupKey: s.groupKey ?? code,
      limitExpressedAs: s.limitExpressedAs,
      limitExpressedAsCas: s.limitExpressedAsCas,
      prohibitionNote: s.prohibitionNote,
      specificationNote: s.specificationNote,
      property: s.property,
      limits: new Map(
        (limits.get(s.id) ?? []).map((l) => {
          const kind = oneOf(l.kind, ["max", "prohibited"] as const, "IFRA limit kind");
          return [l.category ?? "", { kind, maxValue: kind === "max" ? exact(l.maxValue, `the limit of ${code}`) : null }];
        }),
      ),
      substances: own.map((x) => ({ cas: x.cas ?? "", subgroup: x.subgroup, synonyms: x.synonyms ?? [] })),
      variantRules: (rules.get(s.id) ?? []).map((r) => ({
        field: oneOf(r.field, ["species", "process"] as const, "variant field"),
        match: oneOf(r.match, ["contains", "starts"] as const, "variant match"),
        pattern: r.pattern ?? "",
        variant: oneOf(r.variant, ["prohibited", "permitted"] as const, "variant"),
      })),
      specExclusions: (exclusions.get(s.id) ?? []).map((x) => ({ process: x.process ?? "", note: x.note ?? "" })),
    });
    for (const x of own) if (x.cas) byCas.set(x.cas, [...(byCas.get(x.cas) ?? []), code]);
  }
  return {
    standards,
    byCas,
    annex: rows.annex.map((a) => ({
      naturalCas: a.naturalCas,
      naturalOtherCas: a.naturalOtherCas ?? [],
      naturalName: a.naturalName ?? "",
      botanicalName: a.botanicalName,
      constituentCas: a.constituentCas,
      constituentName: a.constituentName ?? "",
      concentration: exact(a.concentration, `the concentration of ${a.constituentName} in ${a.naturalName}`),
      constituentStandard: a.constituentStandard,
      notice: a.notice,
    })),
  };
}

/** The layer as the copy holds it: empty until it is loaded and downloaded, never an invented limit. */
export async function loadIfraLayer(db: LocalDb): Promise<IfraLayer> {
  const [standards, limits, substances, annex, variantRules, specExclusions] = await Promise.all([
    db.select().from(local.ifraStandards),
    db.select().from(local.ifraLimits),
    db.select().from(local.ifraSubstances),
    db.select().from(local.ifraAnnex),
    db.select().from(local.ifraVariantRules),
    db.select().from(local.ifraSpecExclusions),
  ]);
  return buildIfraLayer({ standards, limits, substances, annex, variantRules, specExclusions });
}
