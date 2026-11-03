import { PromptDialog } from "../bench/Dialogs";
import { texts } from "../i18n/en";

const t = texts.maceration;

/** A maceration check's note, in the app's dialog, not the browser's (F-02, picked 2026-11-02). Empty marks it seen. */
export function MacerationNote(props: { check: number; onSave: (text: string) => void; onClose: () => void }) {
  return (
    <PromptDialog
      title={t.askTitle(props.check)}
      label={t.askLabel}
      help={t.askHelp}
      acceptLabel={t.save}
      submit={(text) => {
        props.onSave(text);
        return null;
      }}
      onClose={props.onClose}
    />
  );
}
