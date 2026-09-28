import type { CSSProperties } from "react";
import type { MaterialFamily } from "../data/catalog";
import { texts } from "../i18n/es";

const t = texts.family;

/**
 * How a material shows its family (P48): the icon takes the family's colour as a
 * tint with a solid edge, and the icon's letters are the second cue the lab asks for.
 * A material without a family keeps the plain icon: a gap is never the grey family.
 */
export function familyLook(family: MaterialFamily | undefined): { className: string; style?: CSSProperties; title: string } {
  if (!family) {
    return { className: "", title: t.none };
  }
  return { className: "fam", style: { "--fam": family.family.colour } as CSSProperties, title: familyText(family) };
}

/** «Amaderado · matiz floral · confianza alta». */
export function familyText(family: MaterialFamily | undefined): string {
  if (!family) {
    return t.none;
  }
  const parts = [family.family.name];
  if (family.hue) {
    parts.push(t.hue(family.hue.name.toLowerCase()));
  }
  parts.push(t.confidence(family.confidence));
  return parts.join(" · ");
}
