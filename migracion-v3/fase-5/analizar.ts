import { execSync } from "node:child_process";
import { v2Key } from "../../src/v2/to-ifra.ts";
import { ROOT, loadPairs, loadV2, loadV3, type Pair } from "./cargar.ts";
import { type Canon, canonOf, compare, type Side } from "./comparar.ts";
import { contextOf, describeRemoved, type Explained, explain, type PairContext, REASONS, type Stage, v2Variants } from "./explicar.ts";

/**
 * The whole check, as data: for each of the user's lab materials, the IfraMaterial of the v3 (the common one and
 * the user's version) against the one of its pair in the v2, every difference with its reason, and the card
 * state (V3-25) on both sides. The report and the CSV are only a way of writing this down.
 */

export type Version = "común" | "tuya";
export const VERSIONS: readonly Version[] = ["común", "tuya"];

/** What the card says of IFRA, in the words of the v2's states. */
const V3_STATE: Readonly<Record<string, string>> = {
  prohibited: "prohibido",
  ceiling: "con-techo",
  requirement: "condicion",
  "by-constituents": "por-constituyentes",
  "no-data": "sin-dato",
  "no-standard": "sin-estandar",
};

export interface MaterialResult {
  readonly pair: Pair;
  readonly v3Kind: string;
  readonly v2Type: string | null;
  readonly context: PairContext | null;
  /** What the user's version carries of its product's documents (V3-39): the certificate's composition, the maker's ceiling, a claim of a specification. */
  readonly certificate: { readonly composition: boolean; readonly ceiling: boolean; readonly claim: boolean };
  /** The differences of each version against the v2 pair; empty when they are equal; null without a pair. */
  readonly diffs: Readonly<Record<Version, readonly Explained[] | null>>;
  /** What each version says (also without a pair), to show next to the v2's. */
  readonly canon: Readonly<Record<Version, Canon>>;
  readonly card: { readonly v2: string | null; readonly común: string; readonly tuya: string };
  /** Where the card's state differs from the v2's, with its reason (V3-25); null when it does not or there is no pair. */
  readonly cardDiffs: Readonly<Record<Version, Explained | null>>;
}

export interface Analysis {
  readonly results: readonly MaterialResult[];
  readonly v2Commit: string;
  readonly v3Commit: string;
  readonly v2Materials: number;
  readonly v3Materials: number;
  readonly layerStandards: number;
  readonly layerAnnex: number;
  /** The name IFRA gives each standard, by its code («IFRA_STD_023»). */
  readonly standardNames: ReadonlyMap<string, string>;
  /** The standards that list no CAS in IFRA's files: the layer, which reads by CAS, reaches no material with them. */
  readonly classStandards: ReadonlyArray<{ readonly code: string; readonly name: string; readonly v2Members: number }>;
}

const git = (paths: string): string => {
  try {
    return execSync(`git log -1 --format=%h -- ${paths}`, { cwd: ROOT, encoding: "utf8" }).trim() || "sin commit";
  } catch {
    return "sin commit";
  }
};

export async function analyze(): Promise<Analysis> {
  const v2 = loadV2();
  const v3 = await loadV3();
  const pairs = loadPairs(v2.data, v3.catalog);
  const variants = v2Variants(v2.data, v2.files);
  const groupStandard = new Map(v2.data.groups.filter((g) => g.type === "estandar-ifra").map((g) => [g.id, g.reference]));
  const nameOf = (id: string) => v3.catalog.materials.get(id)?.name ?? id;
  const v2Side = (build: typeof v2.build, rootId: string): Side => ({ data: build.ifra, rootId, nameOfMember: (id) => id });
  const v3Side = (rootId: string): Side => ({ data: v3.ifra, rootId, nameOfMember: nameOf, layer: v3.layer });

  const results = pairs.map((pair): MaterialResult => {
    const common = v3.catalog.materials.get(pair.commonId)!;
    const mine = v3.catalog.materials.get(pair.mineId)!;
    const canon = {
      común: canonOf(v3.ifra.materials.get(pair.commonId), v3Side(pair.commonId))!,
      tuya: canonOf(v3.ifra.materials.get(pair.mineId), v3Side(pair.mineId))!,
    };
    const certificate = {
      composition: mine.components.some((x) => x.authority === "product"),
      ceiling: mine.regulations.some((r) => r.regime === "manufacturer"),
      claim: mine.regulations.some((r) => r.kind === "requirement"),
    };
    const cardOf = (id: string) => V3_STATE[v3.card(id).state];
    const card = { v2: pair.v2Id ? (v2.cards.get(v2Key(pair.v2Id))?.state ?? null) : null, común: cardOf(pair.commonId), tuya: cardOf(pair.mineId) };
    const context = contextOf(pair, v2.data, v2.sources.compositionNotes, common, mine, v3.layer);
    if (!pair.v2Id || !context) {
      return { pair, v3Kind: common.kind, v2Type: null, context: null, certificate, diffs: { común: null, tuya: null }, canon, card, cardDiffs: { común: null, tuya: null } };
    }
    const v2Of = (build: typeof v2.build) => canonOf(build.ifra.materials.get(v2Key(pair.v2Id!)), v2Side(build, pair.v2Id!))!;
    const own = v2Of(v2.build);
    const stages: Record<Version, Stage[]> = {
      común: [
        { reason: "V3-39", canon: v2Of(variants.withoutUserDocuments), describe: describeRemoved(v2.data, pair, ["lote", "producto"], true) },
        { reason: "otros-proveedores", canon: v2Of(variants.withoutBoth), describe: describeRemoved(v2.data, pair, ["literatura", "consenso"], false) },
      ],
      tuya: [{ reason: "otros-proveedores", canon: v2Of(variants.withoutForeign), describe: describeRemoved(v2.data, pair, ["literatura", "consenso"], false) }],
    };
    const diffs = Object.fromEntries(
      VERSIONS.map((version) => {
        const list = compare(own, canon[version]);
        return [version, list.length === 0 ? [] : explain({ pairContext: context, v3Canon: canon[version], stages: stages[version], diffs: list })];
      }),
    ) as Record<Version, Explained[]>;
    // The card (V3-25): the same calculation said in one word. If the material's IFRA differs, the card follows;
    // if it does not, the card differs for what it reads besides the standards: every regulation of the version.
    const cardDiffs = Object.fromEntries(
      VERSIONS.map((version): [Version, Explained | null] => {
        if (card.v2 === card[version]) return [version, null];
        const items = diffs[version];
        const base = { where: "ficha" as const, what: "estado de IFRA", v2: card.v2 ?? "—", v3: card[version], effect: "cambia" as const };
        if (items.length > 0) {
          return [version, { ...base, reason: "consecuencia", evidence: `cambia lo anterior (${[...new Set(items.map((i) => REASONS[i.reason].short))].join("; ")})` }];
        }
        const maker = (version === "tuya" ? mine : common).regulations.some((r) => r.regime === "manufacturer" && r.kind === "max");
        if (card.v2 === "prohibido" && card[version] === "condicion") {
          return [version, { ...base, reason: "V3-25", evidence: "v2: «prohibido» por el estándar que prohíbe una variante; v3: solo la variante prohibida sale prohibida, y la de tu producto sale con su condición" }];
        }
        if (card[version] === "con-techo" && maker) {
          return [version, { ...base, reason: "V3-25", evidence: "v3: la ficha cuenta como techo el tope del fabricante de tu producto (V3-39); la v2 solo miraba los estándares de IFRA" }];
        }
        return [version, { ...base, reason: "sin-explicar", evidence: "ningún motivo de V3-23 a V3-43 lo explica" }];
      }),
    ) as Record<Version, Explained | null>;
    return { pair, v3Kind: common.kind, v2Type: context.v2Material.type, context, certificate, diffs, canon, card, cardDiffs };
  });

  return {
    results,
    v2Commit: v2.sources.commit,
    v3Commit: git("v3/datos migracion-v3/tandas migracion-v3/respuestas"),
    v2Materials: v2.data.materials.length,
    v3Materials: v3.catalog.materials.size,
    layerStandards: v3.layer.standards.size,
    layerAnnex: v3.layer.annex.length,
    standardNames: new Map([...v3.layer.standards].map(([code, s]) => [code, s.name])),
    classStandards: [...v3.layer.standards.values()]
      .filter((s) => s.substances.length === 0)
      .map((s) => ({ code: s.code, name: s.name, v2Members: v2.data.groupMembers.filter((gm) => groupStandard.get(gm.groupId) === s.code).length })),
  };
}
