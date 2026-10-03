import { useState } from "react";
import { texts } from "../i18n/es";
import type { Migration } from "../v2/migrate";

const t = texts.migration;

/**
 * What the migration did when the formula was opened (Phase 5, D13): how many materials went to the v2, which stay as «v1, sin
 * revisar» and every warning, so that nothing is guessed in silence. The file stays as it was until the user changes something.
 */
export function MigrationNotice(props: { migration: Migration; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  const { notes } = props.migration;
  const moved = notes.filter((n) => n.kind === "migrated");
  const stays = notes.filter((n) => n.kind === "v1-only");
  const warnings = notes.filter((n) => n.kind === "cas" || n.kind === "ambiguous");
  if (notes.length === 0) {
    return null;
  }
  return (
    <div className={warnings.length > 0 ? "migration-notice warn" : "migration-notice"} role="status">
      <span className="migration-head">
        <strong>{t.title}.</strong> {t.summary(moved.length, stays.length, warnings.length)} <span className="muted">{t.unchanged}</span>
      </span>
      <button type="button" className="link" onClick={() => setOpen((o) => !o)}>
        {open ? t.hide : t.show}
      </button>
      <button type="button" className="link" onClick={props.onClose}>
        {t.close}
      </button>
      {open && (
        <ul className="migration-list">
          {warnings.map((n, i) => (
            <li key={`w${i}`} className="amber">
              {n.kind === "cas" ? t.cas(n.name, n.formulaCas, n.v2Cas) : n.kind === "ambiguous" ? t.ambiguous(n.name, n.products.join(", ")) : ""}
            </li>
          ))}
          {stays.map((n, i) => (
            <li key={`s${i}`}>{n.kind === "v1-only" ? t.v1Only(n.name) : ""}</li>
          ))}
          {moved.map((n, i) => (
            <li key={`m${i}`} className="muted">
              {n.kind === "migrated" ? `${n.name}: ${t.migrated(n.from, n.to)}${n.confirmedOn ? ` (${t.confirmed(n.confirmedOn)}${n.provisional ? `; ${t.provisionalNote}` : ""})` : ""}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
