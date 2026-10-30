import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Ratio } from "../core/arith/ratio";
import type { Composition } from "../core/compose";
import { formatGrams as gramsWithUnit, formatPercent } from "../core/display";
import type { Recipe } from "../bench/use-formula";
import { texts } from "../i18n/en";
import { diluentsOf } from "./formula";
import "./print.css";

const t = texts.printFormula;
/** The figure alone: the column says it is grams. */
const formatGrams = (ug: Ratio) => gramsWithUnit(ug).replace(/\s*g$/, "");

/**
 * A formula to print or save as PDF (V3-80): its composition and, with a final batch, the weighing
 * sheet of «Use the formula» (V3-55, V3-59), with a box to tick each pour. Only this sheet prints
 * (print.css); the browser's «Save as PDF» makes the file, so the app needs no PDF library.
 */
export function PrintFormula({
  name,
  bench,
  composition,
  weighing,
  onDone,
}: {
  name: string;
  bench: string | null;
  composition: Composition;
  weighing: Recipe | null;
  onDone: () => void;
}) {
  useEffect(() => {
    window.addEventListener("afterprint", onDone);
    const timer = window.setTimeout(() => window.print(), 50);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", onDone);
    };
  }, [onDone]);
  const aromatic = composition.aromaticUg;
  return createPortal(
    <article className="print-sheet">
      <header>
        <h1>{name}</h1>
        <p>{[bench, new Date().toISOString().slice(0, 10), t.summary(formatGrams(composition.totalUg), formatGrams(aromatic))].filter(Boolean).join(" · ")}</p>
      </header>
      <h2>{t.composition}</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>{t.material}</th>
            <th className="num">{t.poured}</th>
            <th className="num">{t.dilution}</th>
            <th>{t.diluents}</th>
            <th className="num">{t.pure}</th>
            <th className="num">{t.ofAromatic}</th>
          </tr>
        </thead>
        <tbody>
          {composition.lines.map((line, i) => {
            const pure = line.massUg.mul(line.fraction);
            return (
              <tr key={line.id}>
                <td>{i + 1}</td>
                <td>{line.material.name}</td>
                <td className="num">{formatGrams(line.massUg)}</td>
                <td className="num">{line.fraction.eq(Ratio.ONE) ? t.neat : formatPercent(line.fraction, 2)}</td>
                <td>{diluentsOf(line).replace(/ (\d+(?:\.\d+)?)/g, (_, p: string) => ` ${p} %`)}</td>
                <td className="num">{formatGrams(pure)}</td>
                <td className="num">{line.material.solvent || aromatic.isZero() ? "" : formatPercent(pure.div(aromatic), 2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {weighing && (
        <>
          <h2>{t.weighing(formatGrams(Ratio.of(weighing.totalUg)), formatPercent(weighing.concentration, 2))}</h2>
          <table>
            <thead>
              <tr>
                <th className="tick">✓</th>
                <th>{t.material}</th>
                <th className="num">{t.weigh}</th>
              </tr>
            </thead>
            <tbody>
              {weighing.lines.map((l) => (
                <tr key={l.line.id}>
                  <td className="tick">☐</td>
                  <td>{l.line.material.name}{l.line.fraction.eq(Ratio.ONE) ? "" : ` (${formatPercent(l.line.fraction, 2)})`}</td>
                  <td className="num">{formatGrams(Ratio.of(l.massUg))}</td>
                </tr>
              ))}
              <tr>
                <td className="tick">☐</td>
                <td>{t.alcohol}</td>
                <td className="num">{formatGrams(Ratio.of(weighing.alcoholUg))}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}
    </article>,
    document.body,
  );
}
