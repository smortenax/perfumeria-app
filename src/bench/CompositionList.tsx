import type { Composition, Part } from "../core/compose";
import { formatGrams, formatPercent } from "../core/display";
import { texts } from "../i18n/es";
import { massText, shareText } from "./format";

const t = texts.composition;

/**
 * The composition column: a list ordered by %, product and % (P23), with its
 * base (§1.1). Solvents go apart, at the foot. Traces in ppm (Banco v2). Only
 * what cannot be kept quiet is marked: what is not checked (§5.5).
 */
export function CompositionList(props: { composition: Composition | null; unchecked: ReadonlySet<string> }) {
  const c = props.composition;
  if (!c || c.parts.length === 0) {
    return (
      <section className="composition">
        <h3>{t.title}</h3>
        <p className="muted">{t.empty}</p>
      </section>
    );
  }
  const row = (part: Part) => {
    const share = shareText(part.massUg, c.totalUg);
    const width = `${Math.max(0.5, Number(part.massUg.div(c.totalUg).toFixed(4)) * 100)}%`;
    const { kind } = part.material;
    return (
      <li key={part.material.key} title={`${massText(part.massUg)} · ${share.exact}`}>
        <span className="bar" style={{ width }} />
        <span className="name">
          {part.material.name}
          {(kind === "base" || kind === "provisional") && !part.material.solvent && (
            <span className={`tag tag-${kind}`}>{texts.addBar.groups[kind]}</span>
          )}
          {kind === "own" && props.unchecked.has(part.material.key) && <span className="tag tag-unchecked">{texts.ifra.unknown}</span>}
        </span>
        <span className="share">{share.text}</span>
      </li>
    );
  };
  const aromatic = c.parts.filter((p) => !p.material.solvent);
  const solvents = c.parts.filter((p) => p.material.solvent);
  return (
    <section className="composition">
      <h3>{t.title}</h3>
      <p className="muted small">{t.base}</p>
      <ul>{aromatic.map(row)}</ul>
      {solvents.length > 0 && (
        <>
          <h4>{t.solvents}</h4>
          <ul>{solvents.map(row)}</ul>
        </>
      )}
      <dl className="totals">
        <dt>{t.total}</dt>
        <dd>{formatGrams(c.totalUg, 3)}</dd>
        <dt>{t.aromatic}</dt>
        <dd>
          {formatGrams(c.aromaticUg, 4)} · {formatPercent(c.aromaticUg.div(c.totalUg), 2)}
        </dd>
      </dl>
    </section>
  );
}
