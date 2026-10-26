import { useEffect, useRef } from "react";
import type { LocalDatabase } from "../db/local/database";
import type { GlossaryData } from "../glossary/useGlossary";
import { texts } from "../i18n/en";
import { NewDilution } from "./NewDilution";

/**
 * «New dilution» as a pop-up (V3-79), from the material's sheet and from the bench's «+»: the same
 * window as on «Dilutions», and closing it leaves you where you were. Escape or the backdrop close it.
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
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.querySelector<HTMLElement>("input, select, button")?.focus();
  }, []);
  return (
    <div className="dilution-popup-backdrop" onMouseDown={onClose}>
      <div
        ref={box}
        className="dilution-popup"
        role="dialog"
        aria-modal="true"
        aria-label={texts.dilutions.newBottle}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <NewDilution data={data} local={local} materialId={materialId} onDone={onDone} onCancel={onClose} />
      </div>
    </div>
  );
}
