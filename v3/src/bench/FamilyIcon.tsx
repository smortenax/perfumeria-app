import type { ReactNode } from "react";
import type { MaterialFamily } from "./data/catalog";
import { familyLook } from "./family";
import { IconText, iconLength } from "./Icon";

export interface IconOf {
  readonly text: string;
  readonly mark?: string | undefined;
  readonly type?: string | undefined;
}

/**
 * A material's icon on the bench (P39, P40), in its family's colour (P48): the one drawing the add bar,
 * the card of the chosen material, the composition and the material chip share (audit F-04). The
 * letters stay in ink on the family's tint, which keeps them at 4.5:1 for every family (audit F-01).
 */
export function FamilyIcon(props: { icon: IconOf; family: MaterialFamily | undefined; className?: string; title?: string }) {
  const look = familyLook(props.family);
  const long = iconLength(props.icon.text, props.icon.mark) > 4;
  const classes = ["code-chip", long ? "long" : "", look.className, props.className ?? ""].filter((c) => c).join(" ");
  return (
    <span className={classes} style={look.style} title={props.title ?? look.title}>
      <IconText text={props.icon.text} mark={props.icon.mark} type={props.icon.type} />
    </span>
  );
}

/** A material as one piece: its icon and its whole name, which wraps rather than being cut (audit F-04). */
export function MaterialChip(props: { name: string; icon: IconOf; family: MaterialFamily | undefined; className?: string; orb?: ReactNode }) {
  return (
    <span className={`material-chip${props.className ? ` ${props.className}` : ""}`}>
      {props.orb ?? <FamilyIcon icon={props.icon} family={props.family} />}
      <span className="material-chip-name">{props.name}</span>
    </span>
  );
}
