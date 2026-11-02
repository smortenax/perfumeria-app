import type { Ratio } from "../core/arith/ratio";
import type { Composition } from "../core/compose";
import { formatGrams, formatPercent } from "../core/display";
import type { IfraReport } from "../core/ifra";
import { headFigures } from "./figures";
import { maxUseText } from "./IfraBox";
import { texts } from "./texts";

const t = texts.figures;

/**
 * The formula in four big figures over its grams (audit F-15 L2, ref-0074 and ref-0078; V3-93): the share
 * of the bottle that is aromatic matter, the grams in it, its aromatic materials and its maximum use by
 * IFRA, read as the verdict reads it (a bound «≤» with something unchecked; «—» when it cannot be said).
 */
export function HeadFigures(props: { composition: Composition | null; totalUg: Ratio; report: IfraReport | null; empty: boolean }) {
  const f = headFigures(props.composition);
  const figures: Array<[string, string]> = [
    [f.aromaticShare ? formatPercent(f.aromaticShare, 1) : t.none, t.aromatic],
    [formatGrams(props.totalUg, 3), t.inBottle],
    [String(f.materials), t.materials],
    [props.report && !props.empty ? maxUseText(props.report) : t.none, t.maxIfra],
  ];
  return (
    <dl className="head-figures" aria-label={t.label}>
      {figures.map(([value, label]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd className="num">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
