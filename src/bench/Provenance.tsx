import { useState } from "react";
import { texts } from "../i18n/es";
import type { DocRef, Provenance } from "../v2/provenance";

const t = texts.provenance;
const comma = (value: string) => value.replace(".", ",");

function Doc(props: { document: DocRef | null }) {
  const { document } = props;
  if (!document) {
    return <span className="muted">{t.noDocument}</span>;
  }
  return (
    <span className="prov-doc" title={document.path}>
      {document.title} · {document.issuer}
      {document.date ? ` · ${document.date}` : ""}
      {!document.reviewed && <span className="pill amber"> {t.unreviewed}</span>}
    </span>
  );
}

/**
 * «De dónde sale» (Phase 5): for a material of the v2, each figure with its authority and the document that gives it, cited;
 * a placeholder seen as one (D2); the manufacturer's ceiling as the product's, not IFRA's (D4); the conditions of IFRA as
 * proven, assumed or pending (D11). A popover of the card: the card itself stays as small as it was.
 */
export function ProvenanceButton(props: { provenance: Provenance | undefined }) {
  const [open, setOpen] = useState(false);
  const { provenance } = props;
  if (!provenance) {
    return null;
  }
  return (
    <>
      <button type="button" className="link prov-button" aria-expanded={open} title={t.buttonHelp} onClick={() => setOpen((o) => !o)}>
        {t.button}
      </button>
      {open && (
        <div className="prov-pop card" role="dialog" aria-label={t.title}>
          <div className="prov-head">
            <strong>{t.title}</strong>
            <button type="button" className="link" onClick={() => setOpen(false)}>
              {t.close}
            </button>
          </div>
          <div className="prov-section">{t.figures}</div>
          {provenance.figures.length === 0 && <div className="muted small">{t.noFigures}</div>}
          {provenance.figures.map((f, i) => (
            <div className="prov-row" key={i}>
              <span className="prov-what">
                {f.component}
                {f.cas && <span className="num cas"> {f.cas}</span>}
              </span>
              <span className="num prov-value" title={`${t.from[f.from]}: ${t.base[f.base]}`}>
                {comma(f.value)}
              </span>
              <span className="prov-auth">
                {t.authority[f.authority as keyof typeof t.authority] ?? f.authority}
                {f.placeholder && (
                  <span className="pill amber" title={t.placeholderHelp}>
                    {" "}
                    {t.placeholder}
                  </span>
                )}
              </span>
              <Doc document={f.document} />
            </div>
          ))}
          {provenance.figures.length > 0 && <div className="muted tiny">{t.base[provenance.figures[0].base]}</div>}
          <div className="prov-section">{t.coverage}</div>
          {provenance.coverages.map((c, i) => (
            <div className="prov-row" key={i}>
              <span className="prov-what">{t.from[c.from]}</span>
              <span className="prov-auth">{t.coverageTexts[c.coverage] ?? c.coverage}</span>
              <Doc document={c.document} />
            </div>
          ))}
          {provenance.ceilings.length > 0 && <div className="prov-section">{t.ceiling}</div>}
          {provenance.ceilings.map((c, i) => (
            <div className="prov-row" key={i}>
              <span className="prov-what">{t.ceilingText(c.maker, c.category, comma(c.maxPct))}</span>
              <Doc document={c.document} />
              <span className="muted tiny">{t.ceilingNote}</span>
            </div>
          ))}
          {provenance.conditions.length > 0 && <div className="prov-section">{t.conditions}</div>}
          {provenance.conditions.map((c, i) => (
            <div className="prov-row" key={i}>
              <span className="prov-what">{c.text}</span>
              <span className={`pill state-pill ${c.state}`} title={t.stateHelp[c.state]}>
                {t.state[c.state]}
              </span>
              {c.authority && <span className="prov-auth">{t.authority[c.authority as keyof typeof t.authority] ?? c.authority}</span>}
              <Doc document={c.document} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
