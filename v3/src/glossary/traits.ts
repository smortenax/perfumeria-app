import type { Catalog, CatalogMaterial, Family } from "../db/catalog";
import { familyOf } from "../families/palette";

/**
 * What Materials filters and sorts by (V3-94): the family, the strength and the hours on a blotter,
 * the parameters a material is looked for by. Each read from the material or, for your version, from
 * the common one it is based on (V3-5). What the data does not say is null: it is never a zero, and the
 * filters give it its own box («no data»).
 */
export interface Traits {
  readonly family: Family | null;
  /** Other families its facets name, by the words each family covers in the palette (V3-94). */
  readonly facetFamilies: readonly Family[];
  /** 0 (low) to 3 (very high). */
  readonly strength: number | null;
  readonly hours: number | null;
}

/** The named bands of the hours on a blotter (V3-94, a proposal of the session): from, to (hours). */
export const DURATION_BANDS = [
  { key: "top", from: 0, to: 2 },
  { key: "heart", from: 2, to: 24 },
  { key: "base", from: 24, to: 168 },
  { key: "fixative", from: 168, to: Number.POSITIVE_INFINITY },
] as const;

export function bandOfHours(hours: number): number {
  return DURATION_BANDS.findIndex((b) => hours < b.to);
}

function inherited<K extends keyof CatalogMaterial>(catalog: Catalog, material: CatalogMaterial, key: K): CatalogMaterial[K] | null {
  let m: CatalogMaterial | undefined = material;
  for (let i = 0; m && i < 10; i++) {
    if (m[key] !== null && m[key] !== undefined) return m[key];
    m = m.basedOnId ? catalog.materials.get(m.basedOnId) : undefined;
  }
  return null;
}

/** A word's stem to match on: a family's «woods» finds a facet's «woody», «animalic» finds «animal». */
function stem(word: string): string {
  const w = word.toLowerCase();
  const cut = w.replace(/(aceous|ous|ic|ed|y|s)$/, "");
  return cut.length >= 4 ? cut : w;
}

/**
 * The stems each family covers, from the palette's «covers» (what goes in each family, V3-76): only
 * what comes before a colon (the rest explains), words of four letters or more.
 */
export function familyStems(palette: ReadonlyMap<Family, { readonly covers: string }>): ReadonlyMap<Family, readonly string[]> {
  return new Map(
    [...palette].map(([family, { covers }]) => [
      family,
      [...new Set((covers.split(":")[0].match(/[a-z]{4,}/gi) ?? []).map(stem))],
    ]),
  );
}

/** The families a facet text names, its own family apart, in the palette's order. */
export function facetFamiliesOf(facets: string | null, own: Family | null, stems: ReadonlyMap<Family, readonly string[]>): Family[] {
  if (!facets) return [];
  const words = facets.toLowerCase().match(/[a-z]+/g) ?? [];
  return [...stems]
    .filter(([family, list]) => family !== own && list.some((s) => words.some((w) => w.startsWith(s))))
    .map(([family]) => family);
}

export function traitsOf(catalog: Catalog, material: CatalogMaterial, stems: ReadonlyMap<Family, readonly string[]>): Traits {
  const family = familyOf(catalog, material);
  const impact = inherited(catalog, material, "impact");
  const hours = inherited(catalog, material, "tenacityHours");
  return {
    family,
    facetFamilies: facetFamiliesOf(inherited(catalog, material, "facets"), family, stems),
    strength: impact !== null ? impact - 1 : null,
    hours: hours ? Number(hours.toFixed(2)) : null,
  };
}

/** A range of steps, both ends included: impacts 1 to 10 as steps 0 to 9 (V3-97), or duration bands 0 to 3. */
export interface StepRange {
  readonly from: number;
  readonly to: number;
}

export interface TraitFilters {
  /** Any of these; empty, every family. */
  readonly families: readonly Family[];
  /** A material counts too in the families its facets name. */
  readonly facets: boolean;
  readonly strength: StepRange | null;
  /** With a strength range: also those whose strength is not known. */
  readonly strengthNoData: boolean;
  readonly duration: StepRange | null;
  readonly durationNoData: boolean;
}

export const NO_TRAIT_FILTERS: TraitFilters = { families: [], facets: false, strength: null, strengthNoData: false, duration: null, durationNoData: false };

const within = (value: number | null, range: StepRange | null, noData: boolean) =>
  range === null || (value === null ? noData : value >= range.from && value <= range.to);

export function keepsTraits(f: TraitFilters, t: Traits): boolean {
  const families =
    f.families.length === 0 ||
    (t.family !== null && f.families.includes(t.family)) ||
    (f.facets && t.facetFamilies.some((x) => f.families.includes(x)));
  return families && within(t.strength, f.strength, f.strengthNoData) && within(t.hours === null ? null : bandOfHours(t.hours), f.duration, f.durationNoData);
}

export const SORTS = ["name", "family", "strength", "duration"] as const;
export type Sort = (typeof SORTS)[number];

/**
 * Materials in the order chosen: by name; by family in the palette's order; by strength or by hours,
 * the most first. What has no data goes last, never first as a zero; ties by name.
 */
export function sortByTraits<M extends { readonly name: string }>(list: readonly M[], sort: Sort, traits: (m: M) => Traits, familyOrder: readonly Family[]): M[] {
  const byName = (a: M, b: M) => a.name.localeCompare(b.name, "es");
  if (sort === "name") return [...list].sort(byName);
  const key = (m: M): number | null => {
    const t = traits(m);
    return sort === "family" ? (t.family === null ? null : familyOrder.indexOf(t.family)) : sort === "strength" ? (t.strength === null ? null : -t.strength) : t.hours === null ? null : -t.hours;
  };
  return [...list].sort((a, b) => {
    const [x, y] = [key(a), key(b)];
    if (x === null || y === null) return x === y ? byName(a, b) : x === null ? 1 : -1;
    return x - y || byName(a, b);
  });
}

/**
 * A press on a step of a range selector: with nothing chosen, that step alone; outside the range, the
 * range grows to it; inside, back to that step alone. Two presses choose «from» and «to».
 */
export function pressStep(range: StepRange | null, step: number): StepRange {
  if (range === null) return { from: step, to: step };
  if (step < range.from) return { from: step, to: range.to };
  if (step > range.to) return { from: range.from, to: step };
  return { from: step, to: step };
}
