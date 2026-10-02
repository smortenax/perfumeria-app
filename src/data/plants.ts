/**
 * The forms of a natural (P54, 2026-10-01): the oil, the absolute, the concrete… of one plant share
 * its CAS but not their IFRA, so they stay apart in the glossary and are folded in the search: one
 * row for the plant, a chip for each form, and its variants (rectified, low in coumarin, a cultivar)
 * under the form. Pure; the catalog gives each natural entry its `plant`.
 */
import type { CatalogEntry } from "./catalog";

/** The kinds of natural of the glossary (`tipo_natural`), in the order the chips go; the plant with no form last. */
export const FORM_ORDER = ["oil", "absolute", "concrete", "extract", "resinoid", "oleoresin", "tincture", "distillate", "terpenes", "gum", "resin", ""];

const FORM_WORDS = new Set(["oil", "absolute", "concrete", "extract", "resinoid", "oleoresin", "tincture", "distillate", "terpenes", "gum", "resin", "essential", "co2"]);

/** What a variant says, in Spanish where the trade has a usual word for it; the rest as the glossary has it. */
const VARIANT_WORDS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bsuper low coumarins?\b/i, "muy bajo en cumarina"],
  [/\blow coumarins?\b/i, "bajo en cumarina"],
  [/\bterpeneless\b/i, "sin terpenos"],
  [/\brectified\b/i, "rectificado"],
  [/\bfolded\b/i, "plegado"],
  [/\bexpressed\b/i, "exprimido"],
  [/\bdistilled\b/i, "destilado"],
  [/\bpyrogenated\b/i, "pirogenado"],
  [/\bdecolou?rized\b/i, "decolorado"],
];

/** A form as the chip says it. */
export function formLabel(form: string): string {
  const labels: Record<string, string> = {
    oil: "aceite",
    absolute: "absoluto",
    concrete: "concreto",
    extract: "extracto",
    resinoid: "resinoide",
    oleoresin: "oleorresina",
    tincture: "tintura",
    distillate: "destilado",
    terpenes: "terpenos",
    gum: "goma",
    resin: "resina",
    "": "sin forma",
  };
  return labels[form] ?? form;
}

/** The words of a name, without punctuation, lower case. */
const wordsOf = (name: string) => name.toLowerCase().match(/[a-z0-9áéíóúñü']+/g) ?? [];

/**
 * A parenthesis that only lists botanical names says nothing a chip needs («(Lavandula angustifolia,
 * Lavandula officinalis)»): it goes. One that says something else stays: «(low coumarin)».
 */
function withoutBotany(name: string): string {
  return name.replace(/\(([^)]*)\)/g, (whole, inner: string) => (/^[A-Z][a-z]+ [a-z]+/.test(inner.trim()) ? "" : whole));
}

/**
 * The variant of each name of one plant: what is left of the name once the words every name of the
 * plant shares (the plant: «lavender») and the words of the form («oil») are taken out. Empty for
 * the plain form. In the order of `names`.
 */
export function variantsOf(names: readonly string[]): string[] {
  const cleaned = names.map(withoutBotany);
  const sets = cleaned.map((n) => new Set(wordsOf(n)));
  const common = new Set([...sets[0]].filter((w) => sets.every((s) => s.has(w))));
  return cleaned.map((name) => {
    let rest = name;
    const said: string[] = [];
    for (const [pattern, label] of VARIANT_WORDS) {
      if (pattern.test(rest)) {
        said.push(label);
        rest = rest.replace(pattern, " ");
      }
    }
    const left = wordsOf(rest).filter((w) => !common.has(w) && !FORM_WORDS.has(w));
    return [...left, ...said].join(" ");
  });
}

/**
 * The name of a plant for its row: the name of its entry with no form and no variant when there is one
 * («Lavender»), or else the words all its names share, as the first name writes them («Lavandin»: its
 * entries with no form are cultivars, «Lavandin abrialis» and «Lavandin grosso»).
 */
export function plantName(names: readonly string[], forms: readonly string[], variants: readonly string[] = variantsOf(names)): string {
  const plain = forms.findIndex((f, i) => f === "" && variants[i] === "");
  if (plain >= 0) {
    return names[plain];
  }
  const sets = names.map((n) => new Set(wordsOf(withoutBotany(n))));
  const first = withoutBotany(names[0]).match(/[A-Za-z0-9ÁÉÍÓÚÑÜáéíóúñü']+/g) ?? [];
  const shared = first.filter((w) => sets.every((s) => s.has(w.toLowerCase())) && !FORM_WORDS.has(w.toLowerCase()));
  return shared.length > 0 ? shared.join(" ") : names[0];
}

/** The rank of a form among the chips: the order of `FORM_ORDER`, unknown ones before the plant with no form. */
export function formRank(form: string): number {
  const at = FORM_ORDER.indexOf(form);
  return at >= 0 ? at : FORM_ORDER.length - 1.5;
}

/**
 * The forms of every plant, each in its chip order: by form (`FORM_ORDER`), the plain variant first.
 * Two entries with the same form and variant (the FIG's «Lavender oil» and IFRA's long-named one) are
 * one chip: the one with shop names, usual use or a FIG row is kept. Only plants with two forms or more.
 */
export function plantIndex(entries: readonly CatalogEntry[]): Map<string, CatalogEntry[]> {
  const by = new Map<string, CatalogEntry[]>();
  for (const e of entries) {
    if (e.plant) {
      by.set(e.plant.key, [...(by.get(e.plant.key) ?? []), e]);
    }
  }
  const worth = (e: CatalogEntry) => (e.shopNames ? 4 : 0) + (e.usage ? 2 : 0) + (e.material.key.startsWith("fig:") ? 1 : 0);
  const out = new Map<string, CatalogEntry[]>();
  for (const [key, group] of by) {
    const sorted = [...group].sort(
      (a, b) =>
        formRank(a.plant!.form) - formRank(b.plant!.form) ||
        Number(a.plant!.variant !== "") - Number(b.plant!.variant !== "") ||
        a.plant!.variant.localeCompare(b.plant!.variant) ||
        worth(b) - worth(a),
    );
    const seen = new Set<string>();
    const kept = sorted.filter((e) => {
      const id = `${e.plant!.form}|${e.plant!.variant}`;
      return seen.has(id) ? false : (seen.add(id), true);
    });
    if (kept.length > 1) {
      out.set(key, kept);
    }
  }
  return out;
}

/** The words a chip answers to: the form in English and in Spanish, and the words of its variant. */
function chipWords(e: CatalogEntry): string[] {
  const form = e.plant!.form;
  return [form, formLabel(form), ...e.plant!.variant.split(" ")].filter((w) => w !== "").map((w) => w.toLowerCase());
}

/**
 * The chip a plant's row starts on (P54): the form the query names («lavender abs», «absoluto»), or
 * the one found by a shop's name; else the one the user already uses; else the plain oil; else the
 * first. `found` is the entry of the plant the search ranked first; `used` says whether a material is
 * in use (in the formula, or with a last dilution remembered).
 */
export function defaultOption(
  options: readonly CatalogEntry[],
  found: CatalogEntry,
  words: readonly string[],
  shopFound: boolean,
  used: (key: string) => boolean,
): number {
  const same = (e: CatalogEntry) => e.plant!.form === found.plant!.form && e.plant!.variant === found.plant!.variant;
  const named = words.some((w) => w.length >= 3 && chipWords(found).some((c) => c.startsWith(w)));
  if (named || shopFound) {
    const at = options.findIndex(same);
    if (at >= 0) {
      return at;
    }
  }
  const inUse = options.findIndex((e) => used(e.material.key));
  if (inUse >= 0) {
    return inUse;
  }
  const oil = options.findIndex((e) => e.plant!.form === "oil" && e.plant!.variant === "");
  return oil >= 0 ? oil : 0;
}

/**
 * The manufacturers' products of each general material (P62), by the general's key: the general first,
 * then its products by maker. Only generals with at least one product.
 */
export function makerIndex(entries: readonly CatalogEntry[]): Map<string, CatalogEntry[]> {
  const byKey = new Map(entries.map((e) => [e.material.key, e]));
  const out = new Map<string, CatalogEntry[]>();
  for (const e of entries) {
    const general = e.maker?.general;
    if (general && byKey.has(general)) {
      out.set(general, [...(out.get(general) ?? [byKey.get(general)!]), e]);
    }
  }
  for (const [key, group] of out) {
    out.set(key, [group[0], ...group.slice(1).sort((a, b) => a.maker!.name.localeCompare(b.maker!.name))]);
  }
  return out;
}
