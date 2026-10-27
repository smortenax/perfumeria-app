import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { chipText } from "../dilution/Dilutions";
import { coloursOf, familyOf } from "../families/palette";
import { initials } from "../glossary/initials";
import { orbLookOf, orbScalesOf, seedOf } from "../glossary/orb/fromCatalog";
import { smallLook } from "../glossary/orb/orbParams";
import { drawStill } from "../glossary/orb/orbRenderer";
import type { GlossaryData } from "../glossary/useGlossary";
import { texts } from "../i18n/en";
import "./print.css";

const t = texts.printGlossary;
const ORB = 56;
/** The orb's frame on paper: the app's dark frame, so the colours read as on screen. */
const FRAME = "#2b2830";

/**
 * Your materials to print or save as PDF (V3-80, F23): a card each, as the grid shows them, with its
 * orb, its name and abbreviation, family and strength, who makes it and where you bought it, and its
 * dilutions as chips. Only this prints (print.css); a card is never cut between pages. A first
 * draft: its look waits for what the user decides about the visual side.
 */
export function PrintGlossary({ data, onDone }: { data: GlossaryData; onDone: () => void }) {
  const materials = useMemo(
    () => [...data.catalog.materials.values()].filter((m) => m.ownerId !== null && m.kind !== "frozen").sort((a, b) => a.name.localeCompare(b.name, "es")),
    [data],
  );
  // The orbs are canvases painted when seen; on paper each one goes as a still image, painted first.
  const [orbs, setOrbs] = useState<ReadonlyMap<string, string> | null>(null);
  useEffect(() => {
    const scales = orbScalesOf(data.catalog);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = ORB * 2;
    const images = new Map<string, string>();
    for (const m of materials) {
      drawStill(canvas, smallLook(orbLookOf(data.catalog, m, scales), ORB), FRAME, seedOf(m.id));
      images.set(m.id, canvas.toDataURL("image/png"));
    }
    setOrbs(images);
  }, [data, materials]);
  useEffect(() => {
    if (!orbs) return;
    window.addEventListener("afterprint", onDone);
    const timer = window.setTimeout(() => window.print(), 100);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", onDone);
    };
  }, [orbs, onDone]);
  if (!orbs) return null;

  return createPortal(
    <article className="print-sheet print-glossary">
      <header>
        <h1>{t.title}</h1>
        <p>{t.summary(materials.length, new Date().toISOString().slice(0, 10))}</p>
      </header>
      <ul className="print-cards">
        {materials.map((m) => {
          const base = m.basedOnId ? data.catalog.materials.get(m.basedOnId) : undefined;
          const abbreviation = m.abbreviation ?? base?.abbreviation ?? null;
          const family = familyOf(data.catalog, m);
          const colours = coloursOf(data.catalog, m);
          const strength = m.strength ?? base?.strength ?? null;
          const traits = [family ? texts.sheet.families[family] : null, strength ? texts.glossary.orb.strength(texts.sheet.strengths[strength]) : null].filter((x) => x).join(" · ");
          const house = m.house ?? base?.house ?? null;
          const shop = [m.supplier, m.product].filter((x) => x).join(" · ");
          const dilutions = [...(data.catalog.dilutions.get(m.id) ?? [])].filter((d) => !d.archivedAt).sort((a, b) => b.fraction.cmp(a.fraction));
          return (
            <li key={m.id} className="print-card">
              <img src={orbs.get(m.id)} width={ORB} height={ORB} alt="" />
              <div>
                <p className="print-abbr">{abbreviation ?? <i>{initials(m.name)}</i>}</p>
                <p className="print-name">{m.name}</p>
                {traits && (
                  <p>
                    {colours && <span className="print-dot" style={{ background: colours.light }} />}
                    {traits}
                  </p>
                )}
                {house && (
                  <p>
                    {t.house}: {house}
                  </p>
                )}
                {shop && (
                  <p>
                    {t.shop}: {shop}
                  </p>
                )}
                <p className="print-chips">
                  {dilutions.length === 0 ? <span className="print-none">{t.noDilutions}</span> : dilutions.map((d) => <span key={d.id}>{chipText(data, d)}</span>)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </article>,
    document.body,
  );
}
