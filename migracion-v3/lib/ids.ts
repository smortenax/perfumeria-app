import { createHash } from "node:crypto";

/**
 * Stable ids for the v3 (plan v3, §2.4 of the materials' model): a UUID v5 of a fixed namespace
 * and a key of the v2 («v2:M00001»), so that migrating again gives the same ids and nothing
 * is duplicated. The namespace was drawn once, on 2026-10-13, and never changes.
 */
const NAMESPACE = "3e03fbc2-6208-4f77-876b-02c3e9abfbc0";

export function uuidFor(key: string): string {
  const ns = Buffer.from(NAMESPACE.replace(/-/g, ""), "hex");
  const hash = createHash("sha1").update(ns).update(key, "utf8").digest();
  const bytes = hash.subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** The v3 id of a v2 material, product or substance without a material. */
export const v2Id = (id: string): string => uuidFor(`v2:${id}`);

/**
 * A UUID v7 made from a time and a key (plan v3, step 7.5): the time orders a history as the v3 orders
 * one (by id), and the key makes it the same every time the migration runs.
 */
export function uuidv7For(ms: number, key: string): string {
  const time = Math.max(0, Math.floor(ms)).toString(16).padStart(12, "0").slice(-12);
  const rand = createHash("sha256").update(key, "utf8").digest("hex");
  const variant = ((parseInt(rand.slice(3, 4), 16) & 0x3) | 0x8).toString(16);
  return `${time.slice(0, 8)}-${time.slice(8)}-7${rand.slice(0, 3)}-${variant}${rand.slice(4, 7)}-${rand.slice(7, 19)}`;
}
