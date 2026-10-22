import type { Catalog, CatalogMaterial, Strength, Tier } from "../../db/catalog";
import { STRENGTHS } from "../../db/catalog";
import { coloursOf } from "../../families/palette";
import { contourOf, type Note, type OrbLook, percentileScale } from "./orbParams";

/**
 * A material's orb from what the app reads today (the glossary's own fields), until it reads V3-70's
 * sheets (families with their %, potency, diffusion as numbers). This is the one place to switch then.
 * What the data does not say stays undefined, so the orb draws it neutral: unknown never counts as zero.
 * - families: the material's colour (its family's, or the one fixed for it, V3-38), one stop for now.
 * - intensity: its strength, by rank among the catalogue's (the potency scale is still open).
 * - diffusion: not yet, the glossary holds it as free text; no glow.
 * - luminosity: not yet, its source is the owner's call; no inner light.
 * - contour: from its kind (molecule, natural and its process, composition).
 * - note: from its tier; the two in-between tiers read as heart.
 * - durationHours: its tenacity on a blotter.
 */
export interface OrbScales {
  readonly intensity: (value: number | undefined) => number | undefined;
}

export function orbScalesOf(catalog: Catalog): OrbScales {
  const ranks = [...catalog.materials.values()].flatMap((m) => (m.strength ? [rankOf(m.strength)] : []));
  return { intensity: percentileScale(ranks) };
}

const rankOf = (strength: Strength) => STRENGTHS.indexOf(strength);

const NOTE_OF: Readonly<Record<Tier, Note>> = { top: "top", top_heart: "heart", heart: "heart", heart_base: "heart", base: "base" };

/** Absolutes, resinoids, concretes, balsams and tinctures wobble more than oils (the form is in Spanish in the data). */
const HEAVY_FORM = /absolut|resin|concret|b[aá]lsam|tintur|tinctur/i;

/** A field of the material or, for your version (V3-5), of the material it is based on. */
function inherited<K extends keyof CatalogMaterial>(catalog: Catalog, material: CatalogMaterial, key: K): CatalogMaterial[K] | null {
  let m: CatalogMaterial | undefined = material;
  for (let i = 0; m && i < 10; i++) {
    if (m[key] !== null && m[key] !== undefined) return m[key];
    m = m.basedOnId ? catalog.materials.get(m.basedOnId) : undefined;
  }
  return null;
}

export function orbLookOf(catalog: Catalog, material: CatalogMaterial, scales: OrbScales): OrbLook {
  const colours = coloursOf(catalog, material);
  const kind = inherited(catalog, material, "kind");
  const strength = inherited(catalog, material, "strength");
  const tier = inherited(catalog, material, "tier");
  const tenacity = inherited(catalog, material, "tenacityHours");
  const contour =
    kind === "molecule"
      ? contourOf("pure")
      : kind === "natural"
        ? contourOf("natural", HEAVY_FORM.test(inherited(catalog, material, "form") ?? "") ? "absolute" : "oil")
        : kind === "composition" || kind === "frozen"
          ? contourOf("blend")
          : undefined;
  const look: { -readonly [K in keyof OrbLook]: OrbLook[K] } = { families: colours ? [{ color: colours.light, share: 1 }] : [] };
  const intensity = scales.intensity(strength ? rankOf(strength) : undefined);
  if (intensity !== undefined) look.intensity = intensity;
  if (contour !== undefined) look.contour = contour;
  if (tier) look.note = NOTE_OF[tier];
  if (tenacity) look.durationHours = Number(tenacity.toFixed(2));
  return look;
}

/** A small number from a material's id, so two materials with the same look still marble apart. */
export function seedOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (Math.abs(h) % 1000) / 100;
}
