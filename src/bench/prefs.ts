import { DILUENTS, type Material } from "../core/model/material";
import type { ModelVersion } from "../data/repository";
import { updateUserData, userData, type Dilution, type MaterialPrefs, type OwnDiluent } from "./store";

/**
 * What the app remembers of each material, and only that (§4, P25, P26): the
 * last dilution used and up to two favourites. They are the user's data per
 * material, not part of any formula, and they live on disk (§6, store.ts).
 */
export type { Dilution, MaterialPrefs } from "./store";

/** A diluent: one of the app's (§4) or one the user made provisional. */
export type DiluentId = string;

export const prefsOf = (materialKey: string): MaterialPrefs => userData().materials[materialKey] ?? { favorites: [] };

export const sameDilution = (a: Dilution, b: Dilution): boolean =>
  a.percent.replace(",", ".") === b.percent.replace(",", ".") && a.diluent === b.diluent;

export function rememberLast(materialKey: string, dilution: Dilution): void {
  updateUserData((d) => ({
    ...d,
    materials: { ...d.materials, [materialKey]: { ...(d.materials[materialKey] ?? { favorites: [] }), last: dilution } },
  }));
}

/** The model of materials the bench reads: the glossary (v1) unless the user chose the v2. */
export const modelVersion = (): ModelVersion => userData().model ?? "v1";

export function setModelVersion(model: ModelVersion): void {
  updateUserData((d) => ({ ...d, model }));
}

/** The user's name for a material, if they have one (P56). */
export const ownName = (materialKey: string): string | undefined => userData().materials[materialKey]?.name;

/**
 * Remembers the name the user found a material by (P56): «Dartanol», not the glossary's
 * «Bacdanol». Null forgets it, and the material goes back to the glossary's name.
 */
export function rememberName(materialKey: string, name: string | null): void {
  updateUserData((d) => {
    const current = d.materials[materialKey] ?? { favorites: [] };
    const { name: _old, ...rest } = current;
    return { ...d, materials: { ...d.materials, [materialKey]: name ? { ...rest, name } : rest } };
  });
}

/** Adds the dilution as a favourite, or takes it away if it already is one. Two at most: a third pushes out the oldest. */
export function toggleFavorite(materialKey: string, dilution: Dilution): MaterialPrefs {
  const current = prefsOf(materialKey);
  const exists = current.favorites.some((f) => sameDilution(f, dilution));
  const favorites = exists ? current.favorites.filter((f) => !sameDilution(f, dilution)) : [...current.favorites, dilution].slice(-2);
  const next = { ...current, favorites };
  updateUserData((d) => ({ ...d, materials: { ...d.materials, [materialKey]: next } }));
  return next;
}

/** Pure is a button of its own, under the two cells (P53). */
export const isPure = (percent: string): boolean => Number(percent.replace(",", ".")) === 100;

/** The options of the two cells, in order: favourites, the last one used, then the base 10 % and 50 % (P26, P53). Pure has its own button. */
export function percentOptions(prefs: MaterialPrefs): string[] {
  const all = [...prefs.favorites.map((f) => f.percent), prefs.last?.percent, "10", "50"];
  return unique(all.filter((p): p is string => p !== undefined && !isPure(p)));
}

/** The diluent options, in order: favourites, the last one used, then DPG and alcohol. */
export function diluentOptions(prefs: MaterialPrefs): DiluentId[] {
  const all = [...prefs.favorites.map((f) => f.diluent), prefs.last?.diluent, "dpg", "alcohol"];
  return unique(all.filter((d): d is DiluentId => d !== undefined && diluentMaterial(d) !== null));
}

function unique<T>(items: readonly T[]): T[] {
  return items.filter((item, i) => items.findIndex((other) => String(other).replace(",", ".") === String(item).replace(",", ".")) === i);
}

/** The diluents of the app, in the order of the menu of other diluents (§4). */
export const APP_DILUENTS = Object.keys(DILUENTS) as Array<keyof typeof DILUENTS>;

/** The user's provisional diluents: no data, so never checked against IFRA (§1.2, §5.2). */
export const ownDiluents = (): readonly OwnDiluent[] => userData().diluents;

/** The material of a diluent, or null if it is no longer known. */
export function diluentMaterial(id: DiluentId): Material | null {
  if (id in DILUENTS) {
    return DILUENTS[id as keyof typeof DILUENTS];
  }
  const own = userData().diluents.find((d) => d.id === id);
  return own ? { key: `solv-${id}`, kind: "provisional", name: own.name, solvent: true } : null;
}

/** Makes a provisional diluent of the user's, or finds the one with that name. */
export function addOwnDiluent(name: string): DiluentId {
  const clean = name.trim();
  const existing = userData().diluents.find((d) => d.name.toLowerCase() === clean.toLowerCase());
  if (existing) {
    return existing.id;
  }
  const slug = clean
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const id = `prov:${slug || "diluyente"}`;
  updateUserData((d) => ({ ...d, diluents: [...d.diluents, { id, name: clean }] }));
  return id;
}
