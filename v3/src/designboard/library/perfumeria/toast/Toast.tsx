// Copied from designboard 3f221ae (src/library/perfumeria/toast/Toast.tsx), runtime 1.15.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
import { texts } from "./i18n/en";

/**
 * What just happened, said in one line with Undo (vault pass 2026-10-24, F-03, after the vault's
 * spec-toast). The live region is always there, so a screen reader hears each message once, politely;
 * the toast never takes focus; and since it carries an action it stays until it is closed, or until
 * whoever shows it takes it away. `docked`: inside the bench's history, just above it.
 */
export function Toast({ message, onUndo, onClose, docked = false }: { message: string | null; onUndo?: () => void; onClose: () => void; docked?: boolean }) {
  return (
    <div className={`toast-region${docked ? " docked" : ""}`} role="status">
      {message && (
        <p className="toast">
          <span className="toast-text">{message}</span>
          {onUndo && (
            <button type="button" className="toast-action" onClick={onUndo}>
              {texts.app.undo}
            </button>
          )}
          <button type="button" className="toast-close" aria-label={texts.app.dismiss} onClick={onClose}>
            <span aria-hidden="true">×</span>
          </button>
        </p>
      )}
    </div>
  );
}
