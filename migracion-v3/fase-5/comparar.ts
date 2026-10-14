import type { IfraData, IfraMaterial, IfraSubstance } from "../../src/core/ifra.ts";
import type { IfraLayer } from "../../v3/src/db/ifra-layer";

/**
 * The same IfraMaterial of the engine, said in a form that both adapters can be compared by. They name
 * things differently on purpose (the v2 by standard, the v3 by group and ceiling; each with its own
 * wording), so before comparing, every key and every text is reduced to what it says:
 *
 * - a substance: `std:IFRA_STD_154` (a ceiling of a standard), `prohibido:IFRA_STD_154` (prohibited as
 *   such), `tope` (the manufacturer's ceiling of the product, or `tope:<other member>`);
 * - a condition, an assumed one or a pending note: a token (`cond:IFRA_STD_067`, `espec:IFRA_STD_119`,
 *   `sin-datos`…); a text that none of the patterns knows stays whole as `otro:<text>`, so that
 *   nothing is hidden by the reduction.
 */

export interface Entry {
  /** An exact fraction «a/b» of the material's pure matter; null when it is not proven. */
  readonly fraction: string | null;
  /** The bound of a load that is not proven; null when there is none (the whole material, at worst). */
  readonly upper: string | null;
  /** The substance's ceiling (a fraction of the finished product) and its group. */
  readonly limit: string;
  readonly combined: string | null;
}

export interface Canon {
  readonly status: string;
  readonly entries: ReadonlyMap<string, Entry>;
  readonly conditions: ReadonlySet<string>;
  readonly assumed: ReadonlySet<string>;
  readonly pending: ReadonlySet<string>;
}

export interface Side {
  readonly data: IfraData;
  /** The id of the material itself, whose `tope:` key is the product's own ceiling. */
  readonly rootId: string;
  /** How a key names the member of a `tope:` key, for the ones that are not the material itself. */
  readonly nameOfMember: (id: string) => string;
  /** The v3 only: which standards a group key with a ceiling (`furocumarinas@0.0004`) stands for. */
  readonly layer?: IfraLayer;
}

const text = (r: { toString(): string }) => r.toString();

/** «a/b» in lowest terms, as `Ratio.toString` gives it (both repositories' Ratio print alike). */
const exact = (r: { toString(): string } | null | undefined): string | null => (r ? text(r) : null);

/** The standards a v3 key with a ceiling stands for: `furocumarinas@0.0004` is the ones of that group with that ceiling. */
function standardsOfKey(group: string, limit: string | null, layer: IfraLayer | undefined): string[] {
  if (!layer || limit === null) return [group];
  const found = [...layer.standards.values()]
    .filter((s) => s.groupKey === group && s.limits.get("4")?.maxValue?.toString() === limit)
    .map((s) => s.code)
    .sort();
  return found.length > 0 ? found : [group];
}

/** The canonical name of an engine key, whichever adapter made it. */
export function canonicalKey(key: string, side: Side, substance: IfraSubstance | undefined): string {
  const [kind, ...rest] = key.split(":");
  const id = rest.join(":");
  if (kind === "tope") return id === side.rootId ? "tope" : `tope:${side.nameOfMember(id)}`;
  if (kind === "prohibido") return `prohibido:${id}`;
  if (kind === "std") {
    const at = id.indexOf("@");
    if (at < 0) return `std:${id}`;
    return `std:${standardsOfKey(id.slice(0, at), exact(substance?.limit), side.layer).join("+")}`;
  }
  return key;
}

const STD = /(?:IFRA_)?STD[ _](\d+)/g;
const codesIn = (t: string): string[] => [...t.matchAll(STD)].map((m) => `IFRA_STD_${m[1]}`);

/** The v2 and the v3 say the same pending note in other words: this is what each one means. */
export function pendingToken(t: string): string {
  const standard = codesIn(t).at(-1) ?? "";
  if (t === "Sin datos de sus constituyentes: puede llevar sustancias con techo.") return "sin-datos";
  if (t.startsWith("Impurezas sin declarar: es un aislado natural")) return "impurezas:aislado-natural";
  if (t.startsWith("Impurezas sin declarar: se le conocen impurezas")) return "impurezas:conocidas";
  if (t.startsWith("Su composición solo cubre los alérgenos")) return "cobertura:solo-alergenos";
  if (t.startsWith("Su composición es parcial")) return "cobertura:parcial";
  if (/prohibido como tal; aquí no llega dentro de un natural/.test(t)) return `prohibido-fuera-de-natural:${standard}`;
  if (/prohibido como tal; lo que trae este material no tiene techo/.test(t)) return `prohibido-sin-techo:${standard}`;
  if (/IFRA prohíbe el crudo y solo permite el rectificado/.test(t)) return `espec:${standard}`;
  if (/su especificación no está acreditada/.test(t)) return `espec:${standard}`;
  if (/el límite es de .* en el producto y no se sabe cuánto lleva/.test(t)) return `limite-constituyente:${standard}`;
  if (/: no está acreditado \(IFRA_STD_\d+ · variante\)\.$/.test(t)) return `variante:${standard}`;
  if (/: no está acreditado \(IFRA_STD_\d+\)\.$/.test(t)) return `espec:${standard}`;
  return `otro:${t}`;
}

/** A condition or an assumed one: the standard it is about, and whether it is a bare fact of the standard. */
export function conditionToken(t: string, assumed: boolean): string {
  const codes = [...new Set(codesIn(t))].sort();
  const kind = /^una variante está prohibida \(STD \d+\)$/.test(t) ? "nota-variante" : assumed ? "cond-supuesta" : "cond-probada";
  return codes.length > 0 ? `${kind}:${codes.join("+")}` : `otro:${t}`;
}

export function canonOf(material: IfraMaterial | undefined, side: Side): Canon | null {
  if (!material) return null;
  const entries = new Map<string, Entry>();
  for (const s of material.substances) {
    const substance = side.data.substances.get(s.key);
    const key = canonicalKey(s.key, side, substance);
    if (entries.has(key)) throw new Error(`Two keys for ${key}`);
    entries.set(key, {
      fraction: exact(s.fraction),
      upper: exact(s.upper),
      limit: exact(substance?.limit) ?? "?",
      combined: substance?.combined ?? null,
    });
  }
  const assumed = new Set(material.assumed ?? []);
  return {
    status: material.status,
    entries,
    conditions: new Set(material.conditions.filter((c) => !assumed.has(c)).map((c) => conditionToken(c, false))),
    assumed: new Set([...assumed].map((c) => conditionToken(c, true))),
    pending: new Set((material.pending ?? []).map(pendingToken)),
  };
}

// ------------------------------------------------------------------ the differences

export type Where = "estado" | "sustancia" | "límite" | "condición" | "supuesta" | "pendiente" | "ficha";

export interface Diff {
  readonly where: Where;
  /** The key of the substance, or the token of the note. */
  readonly what: string;
  /** What each side says, in words that both can be compared by. */
  readonly v2: string;
  readonly v3: string;
}

/** How a load reads: «1/100» exact, «≤ 1/50» bounded, «sin cota» unknown without a bound. */
export function sayLoad(e: Entry | undefined): string {
  if (!e) return "—";
  if (e.fraction !== null) return e.fraction;
  return e.upper !== null ? `≤ ${e.upper}` : "sin cota";
}

export function compare(v2: Canon, v3: Canon): Diff[] {
  const out: Diff[] = [];
  if (v2.status !== v3.status) out.push({ where: "estado", what: "status", v2: v2.status, v3: v3.status });
  for (const key of [...new Set([...v2.entries.keys(), ...v3.entries.keys()])].sort()) {
    const a = v2.entries.get(key);
    const b = v3.entries.get(key);
    if (sayLoad(a) !== sayLoad(b)) out.push({ where: "sustancia", what: key, v2: sayLoad(a), v3: sayLoad(b) });
    if (a && b && (a.limit !== b.limit || a.combined !== b.combined)) {
      out.push({ where: "límite", what: key, v2: `${a.limit}${a.combined ? ` (grupo ${a.combined})` : ""}`, v3: `${b.limit}${b.combined ? ` (grupo ${b.combined})` : ""}` });
    }
  }
  const lists = [["condición", "conditions"], ["supuesta", "assumed"], ["pendiente", "pending"]] as const;
  for (const [where, field] of lists) {
    for (const token of [...new Set([...v2[field], ...v3[field]])].sort()) {
      const a = v2[field].has(token);
      const b = v3[field].has(token);
      if (a !== b) out.push({ where, what: token, v2: a ? "sí" : "—", v3: b ? "sí" : "—" });
    }
  }
  return out;
}
