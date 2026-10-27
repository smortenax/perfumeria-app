import { formatPercent } from "../core/display";
import { texts } from "../i18n/en";
import type { FamilyShare } from "./bar";
import "./familyBar.css";

/**
 * A formula's families as one thin bar (F2): a segment per family, as wide as its share of the
 * aromatic matter, in its colour; what has no family, neutral. Its words say the same, for whoever
 * does not see the colours.
 */
export function FamilyBar({ shares, className }: { shares: readonly FamilyShare[]; className?: string }) {
  if (shares.length === 0) return null;
  const words = shares.map((s) => `${s.family ? texts.sheet.families[s.family] : texts.familyBar.none} ${formatPercent(s.share, 0)}`).join(", ");
  return (
    <span className={className ? `family-bar ${className}` : "family-bar"} role="img" aria-label={texts.familyBar.label(words)} title={words}>
      {shares.map((s) => (
        <i key={s.family ?? "none"} style={{ flexGrow: Number(s.share.toFixed(6)), background: s.colour ?? undefined }} className={s.family ? undefined : "none"} />
      ))}
    </span>
  );
}
