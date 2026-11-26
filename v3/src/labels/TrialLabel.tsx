import { useEffect, useRef, useState } from "react";
import { todayIso } from "../db/macerations";
import { texts } from "../i18n/en";
import { Button } from "../Button";
import { Modal } from "../ui/Dialog";
import { trialLabel, type TrialInfo } from "./content";
import { saveJob, type PrintLine } from "./jobs";
import type { Tape } from "./media";
import { canReachPrinter } from "./printer";
import { PrinterButtons, PrinterStatus, TapeControls } from "./PrinterControls";
import { drawTwoLines, pixelsOf } from "./render";
import { usePrinter } from "./usePrinter";
import "./labels.css";

const t = texts.labels;
const MAX_COPIES = 20;

/**
 * «Test label» from a formula's options (the user, 2026-11-26: «diseñar una etiqueta para cuando se
 * hagan pruebas de perfumes asi se puede desde la formulacion sacar etiqueta»): the label of a test
 * bottle, filled from the formula (its name and strength big; «Test», the day and the weight small),
 * both lines editable, as many copies as bottles, and printed on the P15 as the bottles' labels are.
 * «Keep in Labels» leaves it in «Saved batches» of Dilutions › Labels, to print it later or from
 * another device (the phone without Bluetooth, say).
 */
export function TrialLabel({ info, onClose }: { info: Omit<TrialInfo, "day">; onClose: () => void }) {
  const p = usePrinter();
  const [first] = useState(() => trialLabel({ ...info, day: todayIso() }));
  const [big, setBig] = useState(first.big);
  const [small, setSmall] = useState(first.small);
  const [copies, setCopies] = useState(1);
  const lines = (): PrintLine[] => Array.from({ length: copies }, () => ({ big: big.trim(), small: small.trim() }));
  const keep = () => {
    const ok = saveJob({ id: crypto.randomUUID(), savedAt: new Date().toISOString(), day: todayIso(), lines: lines() });
    p.setStatus(ok ? t.kept(copies) : t.notKept);
  };
  const reach = canReachPrinter();

  return (
    <Modal
      title={t.trialTitle}
      error={null}
      onCancel={onClose}
      acceptLabel={reach ? t.print(copies) : t.keep}
      onAccept={() => (reach ? void p.print(lines()) : keep())}
    >
      <p className="help">{t.trialHelp}</p>
      <label className="field">
        <span>{t.trialBig}</span>
        <input value={big} onChange={(e) => setBig(e.target.value)} />
      </label>
      <label className="field">
        <span>{t.trialSmall}</span>
        <input value={small} onChange={(e) => setSmall(e.target.value)} />
      </label>
      <label className="field">
        <span>{t.copies}</span>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_COPIES}
          value={copies}
          onChange={(e) => setCopies(Math.min(MAX_COPIES, Math.max(1, Math.floor(Number(e.target.value)) || 1)))}
        />
      </label>
      <TrialPreview big={big.trim()} small={small.trim()} tape={p.tape} />
      <div className="labels-bar trial-printer">
        <TapeControls p={p} />
        <PrinterButtons p={p} />
        {reach && (
          <Button disabled={p.busy} onClick={keep}>
            {t.keep}
          </Button>
        )}
        <PrinterStatus p={p} />
      </div>
    </Modal>
  );
}

/** The label as the printer will draw it, at its own dots. */
function TrialPreview({ big, small, tape }: { big: string; small: string; tape: Tape }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => pixelsOf(drawTwoLines(big, small, tape, canvas).canvas);
    draw();
    // The font may arrive after the first drawing: draw again once it has.
    void document.fonts?.ready.then(draw);
  }, [big, small, tape]);
  return <canvas ref={ref} className="label-preview" role="img" aria-label={`${big} · ${small}`} />;
}
