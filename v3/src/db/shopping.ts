import { and, eq, isNull } from "drizzle-orm";
import type { Catalog } from "./catalog";
import * as local from "./local/schema";
import { createVersion, setHave, updateMaterial, type LocalDb } from "./materials";

/**
 * Your shopping list (V3-79), on the browser's copy: materials of the glossary you want to buy. No
 * stock is kept anywhere (V3-78): what is missing for a recipe is written down when you use it, and
 * «I have it now» makes the material your specification. Only yours (migration shopping_rls).
 */

export interface ShoppingItem {
  readonly id: string;
  readonly materialId: string;
  readonly product: string | null;
  readonly shop: string | null;
  readonly note: string | null;
  /** The formula it was missing for, when it came from one. */
  readonly formulaId: string | null;
  readonly createdAt: string | null;
}

export interface ShoppingInput {
  readonly materialId: string;
  readonly product?: string | null;
  readonly shop?: string | null;
  readonly note?: string | null;
  readonly formulaId?: string | null;
}

const now = () => new Date().toISOString();
const clean = (value: string | null | undefined) => (value?.trim() ? value.trim() : null);

async function visible(db: LocalDb, userId: string, materialId: string) {
  const [row] = await db.select().from(local.materials).where(eq(local.materials.id, materialId));
  if (!row || (row.ownerId !== null && row.ownerId !== userId)) throw new Error("a material of the glossary or yours");
  return row;
}

async function ownItem(db: LocalDb, userId: string, id: string) {
  const [row] = await db.select().from(local.shoppingItems).where(and(eq(local.shoppingItems.id, id), eq(local.shoppingItems.userId, userId)));
  if (!row) throw new Error("not on your shopping list");
  return row;
}

/** What is still to buy, oldest first. */
export async function listShopping(db: LocalDb, userId: string): Promise<ShoppingItem[]> {
  const rows = await db
    .select()
    .from(local.shoppingItems)
    .where(and(eq(local.shoppingItems.userId, userId), isNull(local.shoppingItems.resolvedAt)));
  return rows
    .map((r) => ({ id: r.id, materialId: r.materialId!, product: r.product, shop: r.shop, note: r.note, formulaId: r.formulaId, createdAt: r.createdAt }))
    .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
}

/**
 * Writes a material down to buy. A material already on the list is not written twice: the line that
 * is there stays, and gains the formula if it had none. Returns its id and whether it is new.
 */
export async function addToShopping(db: LocalDb, userId: string, input: ShoppingInput): Promise<{ id: string; added: boolean }> {
  await visible(db, userId, input.materialId);
  const [open] = await db
    .select()
    .from(local.shoppingItems)
    .where(and(eq(local.shoppingItems.userId, userId), eq(local.shoppingItems.materialId, input.materialId), isNull(local.shoppingItems.resolvedAt)));
  if (open) {
    if (input.formulaId && !open.formulaId) await db.update(local.shoppingItems).set({ formulaId: input.formulaId, updatedAt: now() }).where(eq(local.shoppingItems.id, open.id));
    return { id: open.id, added: false };
  }
  const id = crypto.randomUUID();
  const stamp = now();
  await db.insert(local.shoppingItems).values({
    id,
    userId,
    materialId: input.materialId,
    product: clean(input.product),
    shop: clean(input.shop),
    note: clean(input.note),
    formulaId: input.formulaId ?? null,
    resolvedAt: null,
    specificationId: null,
    createdAt: stamp,
    updatedAt: stamp,
  });
  return { id, added: true };
}

/** Takes a line off the list without buying it (also the «Undo» of a line written down by itself). */
export async function removeFromShopping(db: LocalDb, userId: string, id: string): Promise<void> {
  await ownItem(db, userId, id);
  await db.delete(local.shoppingItems).where(eq(local.shoppingItems.id, id));
}

/**
 * «I have it now»: a material of the glossary becomes your specification of it (with the shop and
 * the product you wrote down) and «I have it»; one of yours is only marked. The line is resolved,
 * and says what it became. Returns the specification's id.
 */
export async function haveItNow(db: LocalDb, userId: string, id: string): Promise<string> {
  const item = await ownItem(db, userId, id);
  if (item.resolvedAt) throw new Error("already off the list");
  const material = await visible(db, userId, item.materialId!);
  let specification = material.id;
  if (material.ownerId === null) {
    specification = await createVersion(db, userId, material.id);
    if (item.shop || item.product) await updateMaterial(db, userId, specification, { supplier: item.shop, product: item.product });
  }
  await setHave(db, userId, specification, true);
  await db.update(local.shoppingItems).set({ resolvedAt: now(), specificationId: specification, updatedAt: now() }).where(eq(local.shoppingItems.id, id));
  return specification;
}

/**
 * The materials of a recipe you do not have (V3-79): neither marked «I have it» nor with a
 * specification of yours that is. Each once, in the order given.
 */
export function missingOf(materialIds: readonly string[], catalog: Pick<Catalog, "have" | "materials">): string[] {
  const owned = new Set(catalog.have);
  for (const m of catalog.materials.values()) if (m.basedOnId && catalog.have.has(m.id)) owned.add(m.basedOnId);
  return [...new Set(materialIds)].filter((id) => !owned.has(id) && !catalog.materials.get(id)?.solvent);
}

/** The list as a CSV to take to the shop: material, product, shop, note, formula. */
export function shoppingCsv(items: readonly ShoppingItem[], nameOf: (materialId: string) => string, formulaOf: (formulaId: string) => string): string {
  const cell = (value: string | null) => {
    const text = value ?? "";
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const rows = items.map((i) => [nameOf(i.materialId), i.product, i.shop, i.note, i.formulaId ? formulaOf(i.formulaId) : null].map(cell).join(","));
  return ["material,product,shop,note,formula", ...rows].join("\n") + "\n";
}
