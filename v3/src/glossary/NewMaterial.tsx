import { type FormEvent, useState } from "react";
import type { MaterialKind } from "../db/catalog";
import type { LocalDatabase } from "../db/local/database";
import { createMaterial } from "../db/materials";
import { texts } from "../i18n/en";
import { CREATABLE_KINDS } from "./edit";

/**
 * A new material of yours (plan v3, step 6.3): a name and a kind, of any kind but a frozen formula.
 * The rest of its record, its composition and its limits, in its editor right after.
 */
export function NewMaterial({ local, onCreated, onCancel }: { local: LocalDatabase; onCreated: (id: string) => void; onCancel: () => void }) {
  const t = texts.editor;
  const [name, setName] = useState("");
  const [kind, setKind] = useState<MaterialKind>("molecule");
  const [error, setError] = useState<string | null>(null);
  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim() === "") {
      setError(t.nameRequired);
      return;
    }
    try {
      onCreated(await createMaterial(local.db, local.userId, { name, kind }));
    } catch (err) {
      setError(t.failed(err instanceof Error ? err.message : String(err)));
    }
  };
  return (
    <article className="sheet">
      <button type="button" className="link" onClick={onCancel}>
        ← {texts.glossary.back}
      </button>
      <h2>{t.newTitle}</h2>
      <p className="hint">{t.newLead}</p>
      <form className="add" onSubmit={(e) => void create(e)}>
        <label className="wide">
          {texts.sheet.fields.name}
          <input type="text" value={name} autoFocus onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          {texts.sheet.fields.kind}
          <select value={kind} onChange={(e) => setKind(e.target.value as MaterialKind)}>
            {CREATABLE_KINDS.map((k) => (
              <option key={k} value={k}>
                {texts.kinds[k]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">{t.create}</button>
        {error && <p className="error">{error}</p>}
      </form>
    </article>
  );
}
