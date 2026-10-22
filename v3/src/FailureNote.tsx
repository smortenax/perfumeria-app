import { texts } from "./i18n/en";

/**
 * An error said in the page, where you were working, instead of the browser's alert (audit F-09): it
 * stays until you close it, and a screen reader hears it once (role «alert»).
 */
export function FailureNote({ message, onClose, floating = false }: { message: string | null; onClose: () => void; floating?: boolean }) {
  if (!message) return null;
  return (
    <p className={`failure${floating ? " floating" : ""}`} role="alert">
      <span>{message}</span>
      <button type="button" className="link" onClick={onClose}>
        {texts.app.dismiss}
      </button>
    </p>
  );
}
