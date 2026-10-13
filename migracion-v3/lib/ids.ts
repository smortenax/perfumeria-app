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
