import { useLayoutEffect, useRef, useState } from "react";
import type { LocalDatabase } from "../db/local/database";
import type { GlossaryData } from "../glossary/useGlossary";
import { texts } from "../i18n/en";
import { NewDilution } from "./NewDilution";

/**
 * «New dilution» as a pop-up (V3-79), from the material's sheet and from the bench's «+» (audit F-03 L3):
 * the same window as on «Dilutions», opening on «I already have it» with the material set; saved, the
 * bench takes the new bottle. A native dialog, as the bench's (audit F-13): the focus goes in and stays
 * in, what is behind is inert, and closing gives the focus back. Escape or the backdrop close it.
 */
export function DilutionPopup({
  data,
  local,
  materialId,
  onDone,
  onClose,
}: {
  data: GlossaryData;
  local: LocalDatabase;
  materialId: string | null;
  onDone: (id: string) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  // Read while rendering, before the dialog takes the focus.
  const [opener] = useState(() => (document.activeElement instanceof HTMLElement ? document.activeElement : null));
  // Closed by this component, not by the browser: then its «close» is not a cancel.
  const leaving = useRef(false);
  useLayoutEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
    // The first thing to write, not «Cancel»: its % with the material set, else the material to find.
    d?.querySelector<HTMLInputElement>(".nd-target input, input[type=search]")?.focus();
    return () => {
      leaving.current = true;
      if (d?.open) d.close();
      opener?.focus();
    };
  }, [opener]);
  return (
    <dialog
      ref={dialog}
      className="dilution-popup"
      aria-label={texts.dilutions.newBottle}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={() => {
        if (!leaving.current) onClose();
      }}
      // A press on the backdrop lands on the dialog itself, outside its body.
      onMouseDown={(e) => {
        if (e.target !== e.currentTarget) return;
        e.preventDefault();
        onClose();
      }}
    >
      <div className="dilution-popup-body">
        <NewDilution data={data} local={local} materialId={materialId} onDone={onDone} onCancel={onClose} />
      </div>
    </dialog>
  );
}
