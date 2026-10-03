import { Ratio } from "../core/arith/ratio.ts";
import type { IfraData, IfraMaterial, IfraSubstance } from "../core/ifra.ts";
import { parseCsvRecords } from "../data/csv.ts";
import type { CompositionRow, Dataset, Material } from "./model.ts";

/**
 * The v2 data as the engine reads it (CLAUDE.md, «Trabajo en la v2»): the composition of every
 * product and material flattened to what IFRA limits, and the `IfraData` of src/core/ifra.ts built
 * from it. The limits are read from IFRA's files (datos/ifra/51/), never from the v2 data.
 *
 * - A product is its certificate where it has one, and its material's data where it does not: per
 *   substance, the most authoritative source wins (lote > producto > anexo IFRA > literatura >
 *   consenso), and a source that covers every regulated substance closes the list.
 * - Without such a source the check is incomplete, never free (§1.2): the material goes with a
 *   pending note, as the castoreum of v1 does.
 * - A placeholder (literatura, consenso) is never known: its load is unknown, bounded by the
 *   maximum of its source (D2).
 * - A manufacturer's ceiling is a substance of its product alone (D4), never of a CAS.
 */

export interface IfraFiles {
  /** datos/ifra/51/estandares.csv */
  readonly estandares: string;
  /** datos/ifra/51/estandar-cas.csv */
  readonly estandarCas: string;
  /** The amendment the limits come from: «51». */
  readonly amendment: string;
}

/** The key of a v2 product, material or lot in a formula: «v2:P00001». */
export const v2Key = (id: string): string => `v2:${id}`;

/** The key of a manufacturer's ceiling: one per product (D4). */
export const ceilingKey = (productId: string): string => `tope:${productId}`;

/**
 * What a material brings of one member of a group (a substance, or a material IFRA limits as
 * itself), as a fraction of its pure matter. `known` is null for a load that is not proven (a
 * placeholder, D2); `upper` is then the most it can be. A proven load has `upper` equal to it.
 */
export interface Load {
  readonly known: Ratio | null;
  readonly upper: Ratio;
}

export interface Flattened {
  /** By v2 id of the member: S00001, or M00006 for a material limited as itself. */
  readonly loads: ReadonlyMap<string, Load>;
  /** The members the material is, not carries: its own substance, or itself. */
  readonly itself: ReadonlySet<string>;
  /** Why the list may be incomplete, in the user's words. */
  readonly pending: readonly string[];
  /** A molecule with no documents, counted as its substance pure by convention (D7). */
  readonly pureByConvention: boolean;
}

const RANK: Readonly<Record<string, number>> = { lote: 0, producto: 1, "anexo-ifra": 2, literatura: 3, consenso: 4 };
const PLACEHOLDERS = new Set(["literatura", "consenso"]);
const pct = (text: string) => Ratio.fromDecimal(text).div(Ratio.of(100));
const isNumber = (text: string) => /^\d+(\.\d+)?$/.test(text);
const short = (standard: string) => `STD ${standard.split("_").pop()}`;

/**
 * The standards of the furocoumarin-containing phototoxic oils that STD 089 names (087 bergamot,
 * 092 lemon…), and 089 itself, whose 5-MOP is the same hazard measured in the furocoumarin. IFRA
 * says in each: the sum of them, each in % of its ceiling, shall not exceed 100 (STD 089).
 */
const FUROCOUMARIN_OILS = new Set(["IFRA_STD_086", "IFRA_STD_087", "IFRA_STD_088", "IFRA_STD_090", "IFRA_STD_091", "IFRA_STD_092", "IFRA_STD_093", "IFRA_STD_096"]);
const FUROCOUMARINS = "furocumarinas";
const FIVE_MOP_STANDARD = "IFRA_STD_089";

const NO_DATA = "Sin datos de sus constituyentes: puede llevar sustancias con techo.";
const IMPURITIES_ISOLATE = "Impurezas sin declarar: es un aislado natural y su producto no tiene documentos.";
const IMPURITIES_KNOWN = "Impurezas sin declarar: se le conocen impurezas reguladas y su producto no tiene documentos.";
const COVERAGE_TEXT: Readonly<Record<string, string>> = {
  "solo-alergenos": "Su composición solo cubre los alérgenos: puede llevar otras sustancias con techo.",
  parcial: "Su composición es parcial: puede llevar otras sustancias con techo.",
  desconocida: NO_DATA,
};

/** The value of one row of composition, as a fraction of the container's pure matter. */
function loadOf(row: CompositionRow): Load {
  const typical = row.typical === "" ? null : pct(row.typical);
  const max = row.max === "" ? null : pct(row.max);
  // A «maximo» or a «rango» counts its top: the worst the source allows.
  const value = (row.valueType === "tipico" ? typical : max) ?? typical ?? max ?? Ratio.ZERO;
  if (PLACEHOLDERS.has(row.authority)) {
    // D2: a placeholder is never known; the most it can be is the maximum of its source.
    return { known: null, upper: max ?? value };
  }
  return { known: value, upper: value };
}

const scale = (load: Load, by: Load): Load => ({
  known: load.known && by.known ? load.known.mul(by.known) : null,
  upper: load.upper.mul(by.upper),
});

/** Two loads of the same member, from two paths: proven only if both are. */
const plus = (a: Load, b: Load): Load => ({
  known: a.known && b.known ? a.known.add(b.known) : null,
  upper: a.upper.add(b.upper),
});

/**
 * Flattens the composition of a product, a lot or a material to the members of IFRA's groups.
 * Only the v2 data is read; which members have a limit is the business of `toIfra`.
 */
export function flatten(data: Dataset, containerId: string): Flattened {
  const materials = new Map(data.materials.map((m) => [m.id, m]));
  const products = new Map(data.products.map((p) => [p.id, p]));
  const lots = new Map(data.lots.map((l) => [l.id, l]));
  const members = new Set(data.groupMembers.map((gm) => gm.memberId));
  const coverage = new Map(data.coverages.map((c) => [`${c.containerId}|${c.documentId}`, c.coverage]));
  const impure = new Set(data.knownImpurities.map((k) => k.substanceId));

  const walk = (id: string, seen: readonly string[]): Flattened => {
    if (seen.includes(id)) {
      throw new Error(`Ciclo entre materiales: ${[...seen, id].join(" → ")}`);
    }
    // The chain of containers that speak for this one, most specific first: lot, product, material.
    const lot = lots.get(id);
    const productId = lot ? lot.productId : products.has(id) ? id : undefined;
    const product = productId ? products.get(productId) : undefined;
    const materialId = product ? product.materialId : id;
    const material = materials.get(materialId) as Material;
    const chain = [lot?.id, product?.id, materialId].filter((c): c is string => c !== undefined);

    const loads = new Map<string, Load>();
    const itself = new Set<string>();
    const pending: string[] = [];
    const add = (member: string, load: Load) => {
      const before = loads.get(member);
      loads.set(member, before ? plus(before, load) : load);
    };
    if (material.type === "sustancia" && material.substanceId) {
      add(material.substanceId, { known: Ratio.ONE, upper: Ratio.ONE });
      itself.add(material.substanceId);
    }
    if (members.has(materialId)) {
      add(materialId, { known: Ratio.ONE, upper: Ratio.ONE });
      itself.add(materialId);
    }

    // Every source of the chain, most authoritative first; within a rank, the most specific
    // container, then the document id, so the order never depends on the files.
    const sources = new Map<string, CompositionRow[]>();
    for (const row of data.composition) {
      if (chain.includes(row.containerId)) {
        const key = `${row.containerId}|${row.documentId}`;
        sources.set(key, [...(sources.get(key) ?? []), row]);
      }
    }
    const ordered = [...sources.entries()].sort(([ka, [a]], [kb, [b]]) => {
      const byRank = (RANK[a.authority] ?? 9) - (RANK[b.authority] ?? 9);
      return byRank || chain.indexOf(a.containerId) - chain.indexOf(b.containerId) || ka.localeCompare(kb);
    });

    const decided = new Set<string>();
    let complete = false;
    let weakest = "desconocida";
    // A source that covers every regulated substance closes the list for what is less authoritative;
    // a source of the same authority (the typical levels of the STD 089, beside the annex) still adds
    // what nobody has said yet.
    let closedRank: number | null = null;
    for (const [key, rows] of ordered) {
      const rank = RANK[rows[0].authority] ?? 9;
      if (closedRank !== null && rank !== closedRank) {
        break;
      }
      for (const row of rows) {
        if (decided.has(row.componentId)) {
          continue;
        }
        decided.add(row.componentId);
        const load = loadOf(row);
        if (materials.has(row.componentId)) {
          const inner = walk(row.componentId, [...seen, id]);
          for (const [member, innerLoad] of inner.loads) {
            add(member, scale(innerLoad, load));
          }
          pending.push(...inner.pending);
        } else {
          add(row.componentId, load);
        }
      }
      const covers = coverage.get(key) ?? "desconocida";
      if (covers === "reguladas-completa") {
        complete = true;
        closedRank = rank;
        continue;
      }
      weakest = covers;
    }
    // D7: a molecule without documents is its substance pure by convention, unless it is a natural
    // isolate or one known to carry regulated impurities: then those are pending.
    let pureByConvention = false;
    // Only placeholders of another supplier (literatura, consenso) are not documents of its product: the
    // convention stands, and what they say only adds their maxima (D2, D9).
    const onlyPlaceholders = ordered.every(([, rows]) => PLACEHOLDERS.has(rows[0].authority));
    if (material.type === "sustancia" && onlyPlaceholders) {
      if (material.origin === "aislado-natural") {
        pending.push(IMPURITIES_ISOLATE);
      } else if (impure.has(material.substanceId)) {
        pending.push(IMPURITIES_KNOWN);
      } else {
        pureByConvention = true;
      }
    } else if (!complete) {
      pending.push(COVERAGE_TEXT[weakest] ?? NO_DATA);
    }
    return { loads, itself, pending: [...new Set(pending)], pureByConvention };
  };

  return walk(containerId, []);
}

/** The IFRA substance a standard limits in category 4, or null when it has no limit there. */
function limitOf(row: Record<string, string>): Ratio | null {
  const cell = row.cat_4;
  if (isNumber(cell)) {
    return pct(cell);
  }
  if (cell === "prohibido") {
    return Ratio.ZERO;
  }
  // «ver-nota»: the ceiling of its note, for what comes from naturals.
  return cell === "ver-nota" && isNumber(row.limite_nota) ? pct(row.limite_nota) : null;
}

/** The app's diluents and their CAS (catalog.ts): their IFRA is that of their CAS in IFRA's index. */
const DILUENT_CAS: ReadonlyArray<readonly [string, string]> = [
  ["solv:dpg", "25265-71-8"],
  ["solv:alcohol", "64-17-5"],
  ["solv:ipm", "110-27-0"],
  ["solv:dep", "84-66-2"],
  ["solv:tec", "77-93-0"],
  ["solv:triacetina", "102-76-1"],
  ["solv:bb", "120-51-4"],
];

/**
 * The `IfraData` of the engine for every product, lot and material of the v2 data, keyed by
 * `v2Key`, plus the app's diluents. Every one of them is «checked»: what is not known goes as a
 * pending note or an unknown load, never as free (§1.2, §5.5).
 */
export function toIfra(data: Dataset, files: IfraFiles): IfraData {
  const standards = new Map(parseCsvRecords(files.estandares).map((s) => [s.estandar, s]));
  const casOf = new Map<string, string[]>();
  const byCas = new Map<string, string[]>();
  for (const row of parseCsvRecords(files.estandarCas)) {
    casOf.set(row.estandar, [...(casOf.get(row.estandar) ?? []), row.cas]);
    byCas.set(row.cas, [...(byCas.get(row.cas) ?? []), row.estandar]);
  }
  const groupStandard = new Map(data.groups.filter((g) => g.type === "estandar-ifra").map((g) => [g.id, g.reference]));
  const standardsOf = new Map<string, string[]>();
  for (const gm of data.groupMembers) {
    const standard = groupStandard.get(gm.groupId);
    if (standard) {
      standardsOf.set(gm.memberId, [...(standardsOf.get(gm.memberId) ?? []), standard]);
    }
  }

  const substances = new Map<string, IfraSubstance>();
  const ifraSubstance = (key: string, name: string, limit: Ratio, standard: string): string => {
    if (!substances.has(key)) {
      const sums = FUROCOUMARIN_OILS.has(standard) || standard === FIVE_MOP_STANDARD;
      substances.set(key, {
        key,
        name,
        limit,
        amendment: files.amendment,
        ...(casOf.has(standard) ? { cas: casOf.get(standard) } : {}),
        ...(sums ? { combined: FUROCOUMARINS } : {}),
      });
    }
    return key;
  };

  /** One member's standards, as what the engine sums, and the notes they leave. */
  const judge = (memberStandards: readonly string[], asItself: boolean, load: Load, into: IfraEntry, fiveMopKnown = false) => {
    for (const standard of memberStandards) {
      const s = standards.get(standard);
      if (!s) {
        continue;
      }
      // One way in, never two: an oil whose 5-MOP is documented counts by it (the 15 ppm of STD 089),
      // and no longer by its own standard, which IFRA gives for when the furocoumarins are unknown.
      if (asItself && fiveMopKnown && FUROCOUMARIN_OILS.has(standard)) {
        continue;
      }
      if (asItself && s.especificacion === "sí") {
        into.conditions.push(`especificación (${short(standard)})`);
      }
      if (asItself && s.prohibicion === "sí") {
        into.substances.push({ key: ifraSubstance(`prohibido:${standard}`, `${s.nombre}, como tal`, Ratio.ZERO, standard), fraction: Ratio.ONE });
        continue;
      }
      const limit = limitOf(s);
      if (asItself && limit && s.limite_expresado_como) {
        // A limit expressed as a constituent (STD 089, citrus oils: 5-MOP) is not a limit of the whole
        // material. A phototoxic oil with a standard of its own (087 bergamot, 088 bitter orange, 092
        // lemon…) is ruled by it when its furocoumarins are not known: IFRA says so in each of them,
        // and nothing is pending. Without one, how much 5-MOP it carries is unknown, so it is pending,
        // never free (§1.2).
        const ruledByItsOwn = memberStandards.some((other) => {
          const o = standards.get(other);
          return other !== standard && o !== undefined && o.propiedad.includes("PHOTOTOXICITY") && limitOf(o) !== null && !o.limite_expresado_como;
        });
        if (ruledByItsOwn) {
          continue;
        }
        into.pending.push(`${s.nombre}: el límite es de ${s.limite_expresado_como} en el producto y no se sabe cuánto lleva este material (${short(standard)}).`);
        continue;
      }
      if (limit) {
        const key = ifraSubstance(`std:${standard}`, s.nombre, limit, standard);
        // D2: a load that is not proven goes with its bound, which the engine counts in the worst case.
        into.substances.push(load.known ? { key, fraction: load.known } : { key, fraction: null, upper: load.upper });
      } else if (s.prohibicion === "sí") {
        into.pending.push(`${s.nombre}: prohibido como tal; lo que trae este material no tiene techo en los datos (${short(standard)}).`);
      }
    }
  };

  const materials = new Map<string, IfraMaterial>();
  const containers = [...data.products.map((p) => p.id), ...data.lots.map((l) => l.id), ...data.materials.map((m) => m.id)];
  for (const id of containers) {
    const flat = flatten(data, id);
    const entry: IfraEntry = { substances: [], conditions: [], pending: [...flat.pending] };
    const fiveMopKnown = [...flat.loads.keys()].some(
      (member) => !flat.itself.has(member) && (standardsOf.get(member) ?? []).includes(FIVE_MOP_STANDARD),
    );
    for (const [member, load] of flat.loads) {
      judge(standardsOf.get(member) ?? [], flat.itself.has(member), load, entry, fiveMopKnown);
    }
    // D4: the manufacturer's ceiling of this product (or of this lot's product), whole in it.
    const productId = data.lots.find((l) => l.id === id)?.productId ?? id;
    const product = data.products.find((p) => p.id === productId);
    for (const ceiling of data.ceilings.filter((c) => c.productId === productId && c.category === "4")) {
      const key = ceilingKey(productId);
      substances.set(key, {
        key,
        name: `${product?.name ?? productId} (tope de ${product?.maker || "su fabricante"})`,
        limit: pct(ceiling.maxPct),
        amendment: "",
        supplier: product?.maker || "fabricante",
      });
      entry.substances.push({ key, fraction: Ratio.ONE });
    }
    materials.set(v2Key(id), {
      status: "checked",
      substances: merge(entry.substances),
      conditions: [...new Set(entry.conditions)],
      ...(entry.pending.length ? { pending: [...new Set(entry.pending)] } : {}),
    });
  }

  // The diluents of the app: their CAS in IFRA's index, or nothing to check (the index is complete).
  for (const [key, cas] of DILUENT_CAS) {
    const entry: IfraEntry = { substances: [], conditions: [], pending: [] };
    judge(byCas.get(cas) ?? [], true, { known: Ratio.ONE, upper: Ratio.ONE }, entry);
    materials.set(key, { status: "checked", substances: entry.substances, conditions: entry.conditions });
  }

  return { substances, materials };
}

type Entry = { key: string; fraction: Ratio | null; upper?: Ratio };

interface IfraEntry {
  substances: Entry[];
  conditions: string[];
  pending: string[];
}

/**
 * Two members under one standard (two isomers of one group) add up. An unknown one leaves the sum
 * unknown: bounded by both bounds when both have one, by the whole material when either has none.
 */
function merge(list: readonly Entry[]): Entry[] {
  const byKey = new Map<string, Entry>();
  for (const entry of list) {
    const before = byKey.get(entry.key);
    if (!before) {
      byKey.set(entry.key, entry);
    } else if (before.fraction && entry.fraction) {
      byKey.set(entry.key, { key: entry.key, fraction: before.fraction.add(entry.fraction) });
    } else {
      const bound = (e: Entry) => e.fraction ?? e.upper;
      const a = bound(before);
      const b = bound(entry);
      byKey.set(entry.key, a && b ? { key: entry.key, fraction: null, upper: a.add(b) } : { key: entry.key, fraction: null });
    }
  }
  return [...byKey.values()];
}

/** What the card of a v2 material says of IFRA: the state, the standard it is limited by as itself, and its note. */
export interface IfraCard {
  readonly state: "prohibido" | "con-techo" | "condicion" | "por-constituyentes" | "sin-dato" | "sin-estandar";
  readonly standardName?: string;
  /** The specification in IFRA's words, with its standard, for the card to show. */
  readonly note?: string;
}

/**
 * The IFRA card of every product, lot and material, in the glossary's own states (v1 LEEME):
 * what the material is as itself (its standards), then what it carries inside. A standard that
 * goes by family (188, 184, 089) reaches a material only as a member of its group.
 */
export function ifraCards(data: Dataset, files: IfraFiles): Map<string, IfraCard> {
  const standards = new Map(parseCsvRecords(files.estandares).map((s) => [s.estandar, s]));
  const groupStandard = new Map(data.groups.filter((g) => g.type === "estandar-ifra").map((g) => [g.id, g.reference]));
  const standardsOf = new Map<string, string[]>();
  for (const gm of data.groupMembers) {
    const standard = groupStandard.get(gm.groupId);
    if (standard) {
      standardsOf.set(gm.memberId, [...(standardsOf.get(gm.memberId) ?? []), standard]);
    }
  }
  const cards = new Map<string, IfraCard>();
  const ids = [...data.products.map((p) => p.id), ...data.lots.map((l) => l.id), ...data.materials.map((m) => m.id)];
  for (const id of ids) {
    const flat = flatten(data, id);
    const own = [...flat.itself].flatMap((member) => standardsOf.get(member) ?? []).map((id2) => standards.get(id2)).filter((s) => s !== undefined);
    const prohibited = own.find((s) => s.prohibicion === "sí" && limitOf(s) === null);
    // A limit expressed as a constituent (089, 5-MOP) is a condition of the family, not a ceiling of the material.
    const limited = own.find((s) => limitOf(s) !== null && !s.limite_expresado_como);
    const byConstituent = own.find((s) => s.limite_expresado_como);
    const specified = own.find((s) => s.especificacion === "sí") ?? byConstituent;
    const inside = [...flat.loads.keys()].some((member) => !flat.itself.has(member) && (standardsOf.get(member) ?? []).length > 0);
    const state: IfraCard["state"] = prohibited
      ? "prohibido"
      : limited
        ? "con-techo"
        : specified
          ? "condicion"
          : inside
            ? "por-constituyentes"
            : flat.pending.includes(NO_DATA)
              ? "sin-dato"
              : "sin-estandar";
    const first = prohibited ?? limited ?? specified;
    cards.set(v2Key(id), {
      state,
      ...(first ? { standardName: first.nombre } : {}),
      ...(specified?.nota_especificacion
        ? { note: `Especificación (${short(specified.estandar)}, ${specified.nombre}): ${specified.nota_especificacion}` }
        : specified?.limite_expresado_como
          ? { note: `Familia (${short(specified.estandar)}, ${specified.nombre}): el límite es de ${specified.limite_expresado_como} en el producto, no del aceite entero.` }
          : {}),
    });
  }
  return cards;
}
