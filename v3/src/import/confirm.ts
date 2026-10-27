import { createVersion, setHave, updateMaterial, type LocalDb } from "../db/materials";

/**
 * «Confirm» of an imported sheet (V3-80, F19): each row you chose becomes yours. A common material
 * gets a specification of yours with the shop and the product of the sheet, and «I have it»; one that
 * is already yours is only marked. Nothing else is written; rows left out stay out.
 */

export interface Choice {
  readonly materialId: string;
  /** Yours if the material is common: your specification of it gets these. */
  readonly ownerId: string | null;
  readonly shop: string;
  readonly product: string;
}

export async function confirmImport(
  db: LocalDb,
  userId: string,
  choices: readonly Choice[],
  onProgress?: (done: number) => void,
): Promise<{ created: number; marked: number }> {
  let created = 0;
  let marked = 0;
  for (const c of choices) {
    if (c.ownerId === null) {
      const id = await createVersion(db, userId, c.materialId);
      if (c.shop.trim() || c.product.trim()) await updateMaterial(db, userId, id, { supplier: c.shop.trim() || null, product: c.product.trim() || null });
      await setHave(db, userId, id, true);
      created++;
    } else {
      await setHave(db, userId, c.materialId, true);
      marked++;
    }
    onProgress?.(created + marked);
  }
  return { created, marked };
}
