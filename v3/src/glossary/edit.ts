import { Ratio } from "../core/arith/ratio";
import {
  type CatalogMaterial,
  CONFIDENCES,
  type Evolution,
  FAMILIES,
  type MaterialChanges,
  type MaterialKind,
  type Physical,
  STRENGTHS,
  TIERS,
} from "../db/catalog";
import { texts } from "../i18n/es";
import { decimal } from "./format";

/**
 * What the editor of one of your materials shows (plan v3, step 6.3): the fields of its record,
 * the same lists as the sheet (V3-47), each with how it is typed and read back. Pure, so it is
 * tested without a screen. The form holds text; `changesOf` turns it into the record's values,
 * exact (a number is a Ratio, never a float), and an empty field is unknown, never zero (§1.2).
 */

export type InputKind = "text" | "long" | "list" | "choice" | "number" | "percent" | "bool" | "evolution";

export interface EditField {
  /** The record's field, or «physical.<field>» for the physical block. */
  readonly key: string;
  readonly label: string;
  readonly input: InputKind;
  readonly options?: ReadonlyArray<readonly [string, string]>;
  /** For a number: the unit it is typed in. */
  readonly unit?: string;
}

export interface EditSection {
  readonly title: string;
  readonly fields: readonly EditField[];
}

/** The kinds a user creates; a frozen formula comes from freezing one (phase 8). */
export const CREATABLE_KINDS: readonly MaterialKind[] = ["molecule", "natural", "composition", "provisional"];

const f = texts.sheet.fields;
const s = texts.sheet;
const field = (key: string, label: string, input: InputKind, extra: Partial<EditField> = {}): EditField => ({ key, label, input, ...extra });
const choices = <T extends string>(values: readonly T[], labels: Readonly<Record<T, string>>) => values.map((v) => [v, labels[v]] as const);

export const EDIT_SECTIONS: readonly EditSection[] = [
  {
    title: s.sections.identity,
    fields: [
      field("name", f.name, "text"),
      field("kind", f.kind, "choice", { options: CREATABLE_KINDS.map((k) => [k, texts.kinds[k]] as const) }),
      field("aliases", f.aliases, "list"),
      field("abbreviation", f.abbreviation, "text"),
      field("cas", f.cas, "text"),
      field("otherCas", f.otherCas, "list"),
      field("species", f.species, "text"),
      field("part", f.part, "text"),
      field("process", f.process, "text"),
      field("chemotype", f.chemotype, "text"),
      field("inci", f.inci, "text"),
      field("form", f.form, "text"),
      field("origin", f.origin, "text"),
      field("house", f.house, "text"),
      field("code", f.code, "text"),
      field("synthesis", f.synthesis, "choice", { options: (["synthetic", "natural", "semisynthetic"] as const).map((v) => [v, s.synthesis[v]] as const) }),
      field("isomers", f.isomers, "text"),
      field("solvent", f.solvent, "bool"),
    ],
  },
  {
    title: s.sections.bottle,
    fields: [
      field("supplier", f.supplier, "text"),
      field("product", f.product, "text"),
      field("productUrl", f.productUrl, "text"),
      field("grade", f.grade, "text"),
      field("purity", f.purity, "percent", { unit: "%" }),
    ],
  },
  {
    title: s.sections.smell,
    fields: [
      field("family", f.family, "choice", { options: choices(FAMILIES, s.families) }),
      field("color", f.color, "text"),
      field("familyDetail", f.familyDetail, "text"),
      field("facets", f.facets, "text"),
      field("odorTarget", f.odorTarget, "text"),
      field("tier", f.tier, "choice", { options: choices(TIERS, s.tiers) }),
      field("tenacityHours", f.tenacity, "number", { unit: "h" }),
      field("tenacitySource", texts.editor.tenacitySource, "text"),
      field("evolution", f.evolution, "evolution"),
      field("strength", f.strength, "choice", { options: choices(STRENGTHS, s.strengths) }),
      field("threshold", f.threshold, "text"),
      field("diffusion", f.diffusion, "long"),
      field("blendEffect", f.blendEffect, "long"),
      field("role", f.role, "text"),
      field("recommendedDilution", f.recommendedDilution, "text"),
      field("cost", f.cost, "text"),
      field("handling", f.handling, "long"),
    ],
  },
  {
    title: s.sections.physical,
    fields: [
      field("physical.state", f.state, "text"),
      field("physical.appearance", f.appearance, "text"),
      field("physical.stains", f.stains, "text"),
      field("physical.solubility", f.solubility, "text"),
      field("physical.density", f.density, "number", { unit: "g/ml" }),
      field("physical.meltingPointC", f.meltingPoint, "number", { unit: "°C" }),
      field("physical.formula", f.formula, "text"),
      field("physical.molecularWeight", f.molecularWeight, "number", { unit: "g/mol" }),
      field("physical.vaporPressure", f.vaporPressure, "text"),
      field("physical.stability", f.stability, "long"),
      field("physical.incompatibilities", f.incompatibilities, "long"),
      field("physical.sources", f.physicalSources, "text"),
    ],
  },
  {
    title: s.sections.notes,
    fields: [
      field("notes", f.notes, "long"),
      field("sources", f.sources, "text"),
      field("confidence", f.confidence, "choice", { options: choices(CONFIDENCES, s.confidences) }),
    ],
  },
];

const ALL = EDIT_SECTIONS.flatMap((x) => x.fields);
export type Form = Readonly<Record<string, string>>;

/** A material's own value of a field, as the form holds it. */
function read(m: CatalogMaterial, key: string): unknown {
  if (key.startsWith("physical.")) return m.physical[key.slice("physical.".length) as keyof Physical];
  return (m as unknown as Record<string, unknown>)[key];
}

/** The form of one of your materials: its own record, not what it inherits (an empty field of a version inherits). */
export function formOf(m: CatalogMaterial): Form {
  const out: Record<string, string> = {};
  for (const x of ALL) {
    const value = read(m, x.key);
    if (x.input === "evolution") {
      m.evolution.forEach((e, i) => (out[`evolution.${i}`] = e === null ? "" : String(e)));
    } else if (x.input === "list") {
      out[x.key] = (value as readonly string[]).join("\n");
    } else if (x.input === "bool") {
      out[x.key] = value ? "true" : "";
    } else if (x.input === "percent") {
      out[x.key] = value ? decimal((value as Ratio).mul(Ratio.of(100)), 12) : "";
    } else if (x.input === "number") {
      out[x.key] = value ? decimal(value as Ratio, 12) : "";
    } else {
      out[x.key] = (value as string | null) ?? "";
    }
  }
  return out;
}

/** A number as typed: «0,935» or «0.935». Null for an empty field; an error for what is not one. */
export function numberOf(text: string): Ratio | null {
  const t = text.trim().replace(",", ".");
  if (t === "") return null;
  if (!/^\d+(\.\d+)?$/.test(t)) throw new FormError(texts.editor.notANumber(text.trim()));
  return Ratio.fromDecimal(t);
}

/** What the user is told, in Spanish, when a field cannot be read. */
export class FormError extends Error {}

/** The changes a form makes to a material: every field it shows, with its value or unknown. */
export function changesOf(form: Form, m: CatalogMaterial): MaterialChanges & { readonly kind?: MaterialKind } {
  const text = (key: string) => (form[key] ?? "").trim() || null;
  const out: Record<string, unknown> = {};
  const physical: Record<string, unknown> = { ...m.physical };
  for (const x of ALL) {
    let value: unknown;
    switch (x.input) {
      case "list":
        value = [...new Set((form[x.key] ?? "").split("\n").map((l) => l.trim()).filter((l) => l !== ""))];
        break;
      case "bool":
        value = form[x.key] === "true";
        break;
      case "percent": {
        const n = numberOf(form[x.key] ?? "");
        value = n === null ? null : n.div(Ratio.of(100));
        break;
      }
      case "number":
        value = numberOf(form[x.key] ?? "");
        break;
      case "evolution":
        value = [0, 1, 2, 3, 4].map((i) => {
          const e = (form[`evolution.${i}`] ?? "").trim();
          return (e === "" ? null : Number(e)) as Evolution;
        });
        break;
      default:
        value = text(x.key);
    }
    if (x.key.startsWith("physical.")) physical[x.key.slice("physical.".length)] = value;
    else out[x.key] = value;
  }
  if (out.name === null) throw new FormError(texts.editor.nameRequired);
  if (typeof out.cas === "string" && !/^\d{2,7}-\d{2}-\d$/.test(out.cas)) throw new FormError(texts.editor.notACas(out.cas));
  for (const c of out.otherCas as string[]) if (!/^\d{2,7}-\d{2}-\d$/.test(c)) throw new FormError(texts.editor.notACas(c));
  if (typeof out.color === "string" && !/^#[0-9a-f]{6}$/.test(out.color)) throw new FormError(texts.editor.notAColor(out.color));
  // An abbreviation you type is yours (V3-37); one you leave as it was keeps its origin.
  out.abbreviationOrigin = out.abbreviation === null ? null : out.abbreviation === m.abbreviation ? m.abbreviationOrigin : "user";
  return { ...(out as MaterialChanges), physical: physical as unknown as Physical, kind: out.kind as MaterialKind };
}
