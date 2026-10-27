import { useEffect, useMemo, useState } from "react";
import type { LocalDatabase } from "../db/local/database";
import { addToShopping, haveItNow, listShopping, removeFromShopping, shoppingCsv, type ShoppingItem } from "../db/shopping";
import type { GlossaryData } from "../glossary/useGlossary";
import { texts } from "../i18n/en";
import { FailureNote } from "../FailureNote";
import "../dilution/dilutions.css";

const t = texts.shopping;

/** The list, live from the copy: it changes when a line is added here, by the bench or by the sync. */
export function useShopping(local: LocalDatabase): { items: ShoppingItem[]; formulaNames: ReadonlyMap<string, string> } {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [formulaNames, setFormulaNames] = useState<ReadonlyMap<string, string>>(new Map());
  useEffect(() => {
    const abort = new AbortController();
    local.powerSync.watch(
      "SELECT count(*) AS n, max(updated_at) AS at FROM shopping_items",
      [],
      { onResult: () => void listShopping(local.db, local.userId).then(setItems) },
      { signal: abort.signal },
    );
    local.powerSync.watch(
      "SELECT id, name FROM formulas",
      [],
      { onResult: (r) => setFormulaNames(new Map((r.rows?._array ?? []).map((x: { id: string; name: string | null }) => [x.id, x.name ?? "—"]))) },
      { signal: abort.signal },
    );
    return () => abort.abort();
  }, [local]);
  return { items, formulaNames };
}

/**
 * «Shopping list» (V3-79): discreet, from the user's corner. What you want to buy, with the product,
 * the shop and a note; what a recipe was missing comes in by itself. It is exported, and «I have it
 * now» makes the material yours.
 */
export function ShoppingList({ data, local, onOpenMaterial }: { data: GlossaryData; local: LocalDatabase; onOpenMaterial: (id: string) => void }) {
  const { items, formulaNames } = useShopping(local);
  const name = (id: string) => data.catalog.materials.get(id)?.name ?? "—";
  const [query, setQuery] = useState("");
  const [materialId, setMaterialId] = useState<string | null>(null);
  const [product, setProduct] = useState("");
  const [shop, setShop] = useState("");
  const [note, setNote] = useState("");
  const [failure, setFailure] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const choices = useMemo(
    () => [...data.catalog.materials.values()].filter((m) => !m.solvent && m.kind !== "frozen").sort((a, b) => a.name.localeCompare(b.name, "es")),
    [data],
  );
  const fail = (e: unknown) => setFailure(t.failed(e instanceof Error ? e.message : String(e)));
  const csv = () => shoppingCsv(items, name, (id) => formulaNames.get(id) ?? "—");

  const add = () => {
    if (!materialId) return;
    void addToShopping(local.db, local.userId, { materialId, product, shop, note }).then((r) => {
      setMessage(r.added ? t.added(name(materialId)) : t.already(name(materialId)));
      setMaterialId(null);
      setQuery("");
      setProduct("");
      setShop("");
      setNote("");
    }, fail);
  };
  const copy = () =>
    void navigator.clipboard.writeText(csv()).then(
      () => setMessage(t.copied(items.length)),
      () => setMessage(t.noClipboard),
    );
  const download = () => {
    const url = URL.createObjectURL(new Blob([csv()], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `shopping-list-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="dilutions shopping">
      <div className="title-bar">
        <h2 className="page-title">{t.title}</h2>
        <span className="buttons">
          <button type="button" className="secondary" disabled={items.length === 0} onClick={copy}>
            {t.copy}
          </button>
          <button type="button" className="secondary" disabled={items.length === 0} onClick={download}>
            {t.download}
          </button>
        </span>
      </div>
      <p className="hint">{t.hint}</p>
      {message && (
        <p className="hint" role="status">
          {message}
        </p>
      )}

      {items.length === 0 ? (
        <p className="hint">{t.empty}</p>
      ) : (
        <ul className="bottle-list shopping-list">
          {items.map((i) => (
            <li key={i.id} className="shopping-line">
              <button type="button" className="link bottle-name" onClick={() => onOpenMaterial(i.materialId)}>
                {name(i.materialId)}
              </button>
              <span className="bottle-detail">
                {[i.product, i.shop, i.note, i.formulaId ? t.forFormula(formulaNames.get(i.formulaId) ?? "—") : null].filter((x) => x).join(" · ")}
              </span>
              <span className="actions">
                <button type="button" onClick={() => void haveItNow(local.db, local.userId, i.id).then((id) => setMessage(t.haveNow(name(i.materialId), id === i.materialId)), fail)}>
                  {t.haveIt}
                </button>
                <button type="button" className="secondary" onClick={() => void removeFromShopping(local.db, local.userId, i.id).catch(fail)}>
                  {t.remove}
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <fieldset>
        <legend>{t.addTitle}</legend>
        {materialId ? (
          <p>
            {t.material}: <strong>{name(materialId)}</strong>{" "}
            <button type="button" className="link" onClick={() => setMaterialId(null)}>
              {texts.dilutions.change}
            </button>
          </p>
        ) : (
          <>
            <label className="field">
              {t.material}
              <input type="search" value={query} placeholder={t.search} onChange={(e) => setQuery(e.target.value)} />
            </label>
            {query.trim() && (
              <ul className="pick-list">
                {choices
                  .filter((m) => m.name.toLowerCase().includes(query.trim().toLowerCase()))
                  .slice(0, 20)
                  .map((m) => (
                    <li key={m.id}>
                      <button type="button" onClick={() => setMaterialId(m.id)}>
                        {m.name}
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </>
        )}
        <div className="pair">
          <label className="field">
            {t.product}
            <input value={product} onChange={(e) => setProduct(e.target.value)} />
          </label>
          <label className="field">
            {t.shop}
            <input value={shop} onChange={(e) => setShop(e.target.value)} />
          </label>
        </div>
        <label className="field">
          {t.note}
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <div className="actions">
          <button type="button" disabled={!materialId} onClick={add}>
            {t.add}
          </button>
        </div>
      </fieldset>
      <FailureNote message={failure} onClose={() => setFailure(null)} floating />
    </section>
  );
}
