import { parseCsvRecords } from "../bench/data/csv";
import type { Catalog, CatalogMaterial, Family } from "../db/catalog";
import { FAMILIES } from "../db/catalog";

/**
 * The palette of the families (V3-38): each closed family of P48 with its colour for a light and a
 * dark theme, from datos/family_palette.csv (batch 15, the lab's piece 11). It is read when the app
 * is built and travels with it, so it works without network. Without the file (before its batch is
 * approved) the palette is empty and every material is neutral: never a colour made up.
 */
export interface FamilyColour {
  readonly family: Family;
  readonly order: number;
  /** «Floral»; and what fits in a small place: «Transf» for «Transformado». */
  readonly name: string;
  readonly short: string;
  /** «rosa malva». */
  readonly colourName: string;
  readonly light: string;
  readonly dark: string;
  /** What goes into it, in words. */
  readonly covers: string;
}

const files = import.meta.glob("../../datos/family_palette.csv", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const text = Object.values(files)[0] ?? "";

export const PALETTE: ReadonlyMap<Family, FamilyColour> = new Map(
  parseCsvRecords(text)
    .filter((r) => (FAMILIES as readonly string[]).includes(r.family) && /^#[0-9a-f]{6}$/.test(r.light) && /^#[0-9a-f]{6}$/.test(r.dark))
    .map((r) => [
      r.family as Family,
      { family: r.family as Family, order: Number(r.order), name: r.name, short: r.short, colourName: r.colour_name, light: r.light, dark: r.dark, covers: r.covers },
    ]),
);

/** A material's family: its own, or, for your version, the one of the material it is based on. */
export function familyOf(catalog: Catalog, material: CatalogMaterial): Family | null {
  let m: CatalogMaterial | undefined = material;
  for (let i = 0; m && i < 10; i++) {
    if (m.family) return m.family;
    m = m.basedOnId ? catalog.materials.get(m.basedOnId) : undefined;
  }
  return null;
}

/** A colour someone fixed (materials.color), on the material or, for your version, its common one. */
function fixedOf(catalog: Catalog, material: CatalogMaterial): string | null {
  let m: CatalogMaterial | undefined = material;
  for (let i = 0; m && i < 10; i++) {
    if (m.color && /^#[0-9a-f]{6}$/i.test(m.color)) return m.color.toLowerCase();
    m = m.basedOnId ? catalog.materials.get(m.basedOnId) : undefined;
  }
  return null;
}

/**
 * A material's colours, light and dark (V3-38): the one fixed if any (the same in both themes), else
 * its family's. Null without either: the material is shown neutral.
 */
export function coloursOf(catalog: Catalog, material: CatalogMaterial): { readonly light: string; readonly dark: string } | null {
  const fixed = fixedOf(catalog, material);
  if (fixed) return { light: fixed, dark: fixed };
  const family = familyOf(catalog, material);
  const colour = family ? PALETTE.get(family) : undefined;
  return colour ? { light: colour.light, dark: colour.dark } : null;
}
