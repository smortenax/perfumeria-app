import { uuidFor } from "./ids.ts";

/**
 * The ids of the common side of the new materials' system (V3-70), shared by its batches
 * (tanda-20-comun-base.ts, tanda-21-perfumate.ts): a UUID v5 of a key that never changes, so
 * that migrating again gives the same ids and two batches that name the same thing agree.
 */
export const batchId = (code: string) => uuidFor(`common:batch:${code}`);
export const sourceId = (key: string) => uuidFor(`common:source:${key}`);
export const vocabId = (list: string, code: string) => uuidFor(`common:vocab:${list}:${code}`);
export const attributeId = (code: string) => uuidFor(`common:attribute:${code}`);
export const substanceId = (cas: string) => uuidFor(`common:substance:${cas}`);
/** A constituent a source names without a CAS. */
export const namedSubstanceId = (name: string) => uuidFor(`common:substance:name:${normalizeKeyPart(name)}`);
export const companyId = (name: string) => uuidFor(`common:company:${normalizeKeyPart(name)}`);
export const materialId = (identityKey: string) => uuidFor(`common:material:${identityKey}`);

/** As common.normalize_key_part in the database: lowercased, spaces collapsed, trimmed; nothing is the empty text. */
export const normalizeKeyPart = (part: string | null | undefined): string => (part ?? "").trim().replace(/\s+/g, " ").toLowerCase();

/** The identity key, exactly as common.identity_key_of computes it (migration common_rules). */
export function identityKey(m: {
  type: "pure" | "natural" | "blend";
  cas?: string | null;
  substanceId?: string;
  isomericForm?: string | null;
  species?: string | null;
  part?: string | null;
  process?: string | null;
  chemotype?: string | null;
  treatments?: readonly string[];
  companyId?: string;
  name?: string;
}): string {
  if (m.type === "pure") return `pure:${m.cas ?? `sub:${m.substanceId}`}:${m.isomericForm ?? ""}`;
  if (m.type === "natural")
    return `natural:${normalizeKeyPart(m.species)}:${m.part ?? ""}:${m.process ?? ""}:${normalizeKeyPart(m.chemotype)}:${[...(m.treatments ?? [])].sort().join("+")}`;
  return `blend:${m.companyId}:${normalizeKeyPart(m.name)}`;
}
