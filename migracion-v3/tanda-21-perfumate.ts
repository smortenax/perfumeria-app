/**
 * Batch 21 of the migration: PerfuMate's catalogue in the new materials' system (V3-70;
 * docs-v3/sistema-materiales.md). Reads migracion-v3/perfumate/perfumate.sqlite3 (the scrape of
 * 2026-10-20, branch perfumate-db, commit ec2f1ab: 2212 materials) and writes
 * migracion-v3/tandas/21-perfumate/, one CSV per table of the `common` schema, its informe.md and,
 * under revision/, what did not go in and what the user has to decide. Needs batch 20 written
 * first (its substances and vocabularies are not written again).
 *
 * Everything PerfuMate says is a claim with PerfuMate as its source and the page as its quote;
 * nothing it says is taken as the manufacturer's word. What the script infers (the type, the
 * species, part, process and treatments of a natural, read from its name and synonyms) is said
 * in the report, with how many it could and could not read.
 *
 *   node migracion-v3/tanda-21-perfumate.ts
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { pctToFraction } from "./lib/cifras.ts";
import {
  attributeId,
  batchId,
  companyId,
  identityKey,
  materialId,
  namedSubstanceId,
  normalizeKeyPart,
  sourceId,
  substanceId,
  vocabId,
} from "./lib/comun.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";
import { parseCsv } from "../v3/scripts/csv.ts";

const DB = "migracion-v3/perfumate/perfumate.sqlite3";
const BASE = "migracion-v3/tandas/20-comun-base";
const OUT = "migracion-v3/tandas/21-perfumate";
const CODE = "21-perfumate";
const BATCH = batchId(CODE);
const PM = sourceId("perfumate");
const SCALE = uuidFor("common:scale:perfumate-impact");
const CAS = /^[0-9]{2,7}-[0-9]{2}-[0-9]$/;

type Row = Record<string, Cell>;
const readBase = (table: string): Record<string, string>[] => {
  const [header, ...rows] = parseCsv(readFileSync(join(BASE, `${table}.csv`), "utf8")).filter((r) => r.length > 1);
  return rows.map((cells) => Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""])));
};
const readV3 = (file: string): Record<string, string>[] => {
  const [header, ...rows] = parseCsv(readFileSync(join("v3/datos", file), "utf8")).filter((r) => r.length > 1);
  return rows.map((cells) => Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""])));
};
const slug = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
/** A number of the scrape (a float in SQLite or JSON) as text, without going through rounding: 8.0 → «8», 0.3 → «0.3». */
const num = (n: number) => {
  const t = String(n);
  if (/e/i.test(t)) throw new Error(`Número en notación científica: ${t}`);
  return t;
};
const pct = (n: number) => pctToFraction(num(n));
/** The exact sum of two decimals written as text («0.67» + «0.08» = «0.75»), through integers. */
function addDecimals(a: string, b: string): string {
  const scale = Math.max(a.split(".")[1]?.length ?? 0, b.split(".")[1]?.length ?? 0);
  const int = (t: string) => BigInt(t.replace(".", "") + "0".repeat(scale - (t.split(".")[1]?.length ?? 0)));
  const digits = (int(a) + int(b)).toString().padStart(scale + 1, "0");
  const whole = digits.slice(0, digits.length - scale);
  const frac = digits.slice(digits.length - scale).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}
let repeatedTerms = 0;
/** A weight PerfuMate may leave out («unweighted families» in its README): no weight is null, never zero. */
const weight = (n: number | null) => (n === null ? null : pct(n));
const shown = (f: { name: string; percentage: number | null }) => (f.percentage === null ? f.name : `${f.name} ${num(f.percentage)} %`);

// ---------------------------------------------------------------- what batch 20 already has
const baseSubstances = new Map(readBase("substances").map((s) => [s.cas, s]));
const baseAliases = new Map(readBase("substance_aliases").map((a) => [a.cas_alias, a.substance_id]));
const baseVocab = new Set(readBase("vocabularies").map((v) => v.id));
const annexNaturalCas = new Set(readV3("ifra_annex.csv").flatMap((a) => a.natural_cas.split(/\s+/).filter(Boolean)));
// Only the botanical names: a natural's name («Lime oil distilled») would make «Lime» a genus.
const annexGenera = new Set(
  readV3("ifra_annex.csv")
    .map((a) => a.botanical_name)
    .map((t) => /^([A-Z][a-z]{2,})\s+[a-z]/.exec(t.trim())?.[1])
    .filter((g): g is string => Boolean(g)),
);

/** The species IFRA's annex gives a natural's CAS: «Citrus aurantium L. spp. Amara Link» → «Citrus aurantium ssp. amara». */
const annexSpecies = new Map<string, string>();
for (const a of readV3("ifra_annex.csv")) {
  const m = /^([A-Z][a-z]{2,})\s+([a-z][a-z-]{2,})(?:.*?\b(?:ssp|spp|subsp|var)\.\s+([A-Za-z][a-z-]+))?/.exec(a.botanical_name.trim());
  if (!m) continue;
  const species = `${m[1]} ${m[2]}${m[3] ? ` ${/var\./.test(a.botanical_name) ? "var." : "ssp."} ${m[3].toLowerCase()}` : ""}`;
  for (const cas of a.natural_cas.split(/\s+/).filter(Boolean)) if (!annexSpecies.has(cas)) annexSpecies.set(cas, species);
}

// ---------------------------------------------------------------- the scrape
interface Entry {
  slug: string;
  url: string;
  name: string;
  supplier: string | null;
  catalogSource: string | null;
  cas: string | null;
  origin: "synthetic" | "natural";
  note: string | null;
  category: string | null;
  description: string;
  impact: number | null;
  substantivityText: string | null;
  substantivityHours: number | null;
  workingDilution: string | null;
  tags: string[];
  synonyms: string[];
  families: { name: string; percentage: number | null }[];
  subcategories: { name: string; percentage: number | null }[];
  constituents: { name: string; cas: string | null; percentage: number }[];
  downloadedAt: string;
}
const db = new DatabaseSync(DB, { readOnly: true });
const entries: Entry[] = (db.prepare("SELECT * FROM materials ORDER BY slug").all() as Record<string, string | number | null>[]).map((r) => ({
  slug: String(r.slug),
  url: String(r.source_url),
  name: String(r.name).trim(),
  supplier: (r.supplier as string | null)?.trim() || null,
  catalogSource: (r.catalog_source as string | null)?.trim() || null,
  cas: (r.cas as string | null)?.trim() || null,
  origin: r.origin as "synthetic" | "natural",
  note: (r.note as string | null) || null,
  category: (r.primary_odor_category as string | null) || null,
  description: String(r.odor_description),
  impact: r.impact as number | null,
  substantivityText: (r.substantivity_text as string | null) || null,
  substantivityHours: r.substantivity_hours as number | null,
  workingDilution: (r.working_dilution as string | null) || null,
  tags: JSON.parse(String(r.tags_json)),
  synonyms: JSON.parse(String(r.synonyms_json)),
  families: JSON.parse(String(r.families_json)),
  subcategories: JSON.parse(String(r.subcategories_json)),
  constituents: JSON.parse(String(r.constituents_json)),
  downloadedAt: String(r.downloaded_at),
}));
db.close();
const sha256 = createHash("sha256").update(readFileSync(DB)).digest("hex");

// ---------------------------------------------------------------- reading a natural from its name
const PRODUCT_WORDS = new Set(
  "oil oils absolute absolue extract extracts resinoid tincture essential co2 concrete resin gum leaf leaves flower flowers seed seeds bark root roots wood herb fruit fruits peel balsam water butter wax hydrosol expressed distilled crude rectified natural isolate acetate alcohol oleoresin pure blend accord terpenes terpeneless heart md fcf fcr eo var ssp subsp and or of the from type".split(" "),
);
const PM_FIRST_WORDS = new Set(entries.map((e) => e.name.split(/\s+/)[0]).filter((w) => /^[A-Z][a-z]+$/.test(w)));
const LATIN_EPITHET = /(a|us|um|is|ii|ae|ensis|ata|ina|osa|ens|ans|or|ix|ex|on|ia|ea|ei|i)$/;

/** «Salvia sclarea» from «Salvia sclarea absolute»: a genus IFRA's annex knows, or a Latin-looking pair that is not one of PerfuMate's common names. */
function speciesOf(e: Entry): { species: string; from: string } | null {
  const candidates = [...e.synonyms, e.name, ...[...e.name.matchAll(/\(([^)]+)\)/g)].map((m) => m[1])];
  for (const text of candidates) {
    const words = text.trim().split(/\s+/);
    const [genus, epithet] = words;
    if (!genus || !epithet || !/^[A-Z][a-z]{2,}$/.test(genus) || !/^[a-z][a-z-]{2,}$/.test(epithet) || PRODUCT_WORDS.has(epithet)) continue;
    const known = annexGenera.has(genus) || (!PM_FIRST_WORDS.has(genus) && LATIN_EPITHET.test(epithet));
    if (!known) continue;
    let species = `${genus} ${epithet}`;
    const [w3, w4] = words.slice(2);
    if (w3 && /^(var\.|ssp\.|subsp\.)$/.test(w3) && w4 && /^[a-z-]+$/.test(w4)) species += ` ${w3} ${w4}`;
    else if (w3 && /^[a-z][a-z-]{2,}$/.test(w3) && !PRODUCT_WORDS.has(w3) && !PARTS.some(([re]) => re.test(w3)) && LATIN_EPITHET.test(w3)) species += ` ${w3}`;
    return { species, from: text };
  }
  return null;
}
const PARTS: ReadonlyArray<readonly [RegExp, string, string]> = [
  [/\bpetitgrain\b/i, "leaf_twig", "leaf and twig"],
  [/\b(leaf|leaves)\b/i, "leaf", "leaf"],
  [/\b(flower|flowers|blossom)\b/i, "flower", "flower"],
  [/\bseeds?\b/i, "seed", "seed"],
  [/\bbark\b/i, "bark", "bark"],
  [/\brhizomes?\b/i, "rhizome", "rhizome"],
  [/\broots?\b/i, "root", "root"],
  [/\bwood\b/i, "wood", "wood"],
  [/\b(peel|rind)\b/i, "peel", "peel"],
  [/\b(berry|berries)\b/i, "berry", "berry"],
  [/\bfruits?\b/i, "fruit", "fruit"],
  [/\bneedles?\b/i, "needle", "needle"],
  [/\btwigs?\b/i, "twig", "twig"],
  [/\bbuds?\b/i, "bud", "bud"],
  [/\bherb\b/i, "herb", "herb"],
];
const PROCESSES: ReadonlyArray<readonly [RegExp, string, string]> = [
  [/\babsol(ute|ue)\b/i, "absolute", "absolute"],
  [/\bconcrete\b/i, "concrete", "concrete"],
  [/\b(co2|supercritical)\b/i, "co2_extract", "CO₂ extract"],
  [/\bresinoid\b/i, "resinoid", "resinoid"],
  [/\boleoresin\b/i, "oleoresin", "oleoresin"],
  [/\b(tincture|infusion)\b/i, "tincture", "tincture"],
  [/\b(hydrosol|floral water)\b/i, "hydrosol", "hydrosol"],
  [/\bterpenes\b/i, "terpene_fraction", "terpene fraction"],
  [/\b(expressed|cold[- ]pressed)\b/i, "expressed_oil", "expressed oil"],
  [/\b(distilled)\b/i, "distilled_oil", "distilled oil"],
  [/\bbalsam\b/i, "balsam", "balsam"],
  [/\b(gum|resin)\b/i, "exudate", "exudate"],
  [/\b(essential oil|oil|eo|essence)\b/i, "essential_oil", "essential oil"],
];
const TREATMENTS: ReadonlyArray<readonly [RegExp, string, string]> = [
  [/\bfcf\b|bergapten[- ]free|furocoumarin[- ]free/i, "fcf", "furocoumarin-free (FCF)"],
  [/\bfcr\b|furocoumarin[- ]reduced/i, "fcr", "furocoumarin-reduced (FCR)"],
  [/terpeneless|deterpenated|terpene[- ]free/i, "terpeneless", "terpeneless"],
  [/\brectified\b/i, "rectified", "rectified"],
  [/decolou?ri[sz]ed/i, "decolorized", "decolorized"],
  [/low[- ]atranol/i, "low_atranol", "low atranol"],
  [/iron[- ]free/i, "iron_free", "iron-free"],
];
const firstOf = (table: ReadonlyArray<readonly [RegExp, string, string]>, ...texts: string[]) => {
  for (const text of texts) for (const [re, code, name] of table) if (re.test(text)) return { code, name };
  return null;
};
const isNaturalCas = (cas: string) =>
  annexNaturalCas.has(cas) || baseSubstances.get(cas)?.kind === "natural_uvcb" || /^80\d\d-\d\d-\d$/.test(cas) || /^(6[89]|8[4-9]|9[0-7])\d{3}-\d\d-\d$/.test(cas);
const NATURAL_NAME = /\b(oil|absolute|absolue|extract|resinoid|tincture|concrete|co2|balsam|gum|resin|hydrosol|butter|terpenes|essence)\b/i;

// ---------------------------------------------------------------- output tables
const vocabularies = new Map<string, Row>();
const equivalences = new Map<string, Row>();
const companies = new Map<string, Row>();
const substances = new Map<string, Row>();
const materials = new Map<string, Row>();
const naturalTreatments = new Map<string, Row>();
const identifiers = new Map<string, Row>();
const texts: Row[] = [];
const products = new Map<string, Row>();
const compositions: Row[] = [];
const compositionLines: Row[] = [];
const claims: Row[] = [];
const claimTerms: Row[] = [];
const pending: Row[] = [];
const conflicts: Row[] = [];
const notes: string[] = [];

function term(list: string, code: string, name: string, extra: Row = {}): string {
  const id = vocabId(list, code);
  if (!baseVocab.has(id) && !vocabularies.has(id)) vocabularies.set(id, { id, list, code, name, parent_id: null, color: null, sort: null, batch_id: BATCH, ...extra });
  return id;
}
function equivalence(list: string, sourceTerm: string, vocabularyId: string) {
  const id = uuidFor(`common:equivalence:perfumate:${list}:${sourceTerm}`);
  equivalences.set(id, { id, source_id: PM, source_term: sourceTerm, list, vocabulary_id: vocabularyId, note: null, batch_id: BATCH });
}
function company(raw: string): string {
  const name = raw.split(";")[0].trim();
  const id = companyId(name);
  if (!companies.has(id)) companies.set(id, { id, name, role: null, country_id: null, website: null, batch_id: BATCH });
  return id;
}
/** The substance of a CAS: batch 20's, through an alias if it is one, or a new one. */
function substance(cas: string | null, name: string, kind = "defined"): string {
  if (cas && baseAliases.has(cas)) return baseAliases.get(cas)!;
  if (cas && baseSubstances.has(cas)) return baseSubstances.get(cas)!.id;
  const id = cas ? substanceId(cas) : namedSubstanceId(name);
  if (!substances.has(id)) substances.set(id, { id, cas, name: name.trim(), kind, formula: null, molecular_weight: null, smiles: null, inchikey: null, pubchem_cid: null, batch_id: BATCH });
  return id;
}

// PerfuMate's families, as PerfuMate gives them (V3-71): each one a term of its own, with its
// English name and no parent; which ones join, or fold into fewer, is decided when there are more
// sources.
function family(pmName: string): string {
  const id = term("family", slug(pmName), pmName.trim());
  equivalence("family", pmName, id);
  return id;
}
const NOTE: Readonly<Record<string, string>> = { top: "top", heart: "heart", base: "base" };
function note(pmNote: string): string {
  const id = NOTE[pmNote] ? vocabId("note", NOTE[pmNote]) : term("note", slug(pmNote), pmNote === "outside" ? "outside the pyramid (PerfuMate)" : pmNote);
  equivalence("note", pmNote, id);
  return id;
}
function listTerm(list: "subfamily" | "descriptor", pmTerm: string): string {
  const id = term(list, slug(pmTerm), pmTerm.trim());
  equivalence(list, pmTerm, id);
  return id;
}

// ---------------------------------------------------------------- classify each entry
type Kind = "pure" | "natural" | "blend";
interface Classified {
  entry: Entry;
  type: Kind;
  key: string;
  origin: string;
  substance: string | null;
  cas: string | null;
  species?: string;
  part?: { code: string; name: string } | null;
  process?: { code: string; name: string } | null;
  chemotype?: string | null;
  treatments?: { code: string; name: string }[];
  company?: string;
}
const classified: Classified[] = [];
// A natural whose name and synonyms give no species takes the one of its CAS: IFRA's annex first,
// then another PerfuMate entry with the same CAS whose species could be read. Said in the report.
const speciesByCas = new Map<string, string>();
for (const e of entries) {
  const read = e.origin === "natural" && e.cas ? speciesOf(e) : null;
  if (read && !speciesByCas.has(e.cas!)) speciesByCas.set(e.cas!, read.species);
}
const bySource = { annex: 0, sibling: 0 };
function fromCas(cas: string): { species: string; from: string } | null {
  if (annexSpecies.has(cas)) {
    bySource.annex++;
    return { species: annexSpecies.get(cas)!, from: "" };
  }
  if (speciesByCas.has(cas)) {
    bySource.sibling++;
    return { species: speciesByCas.get(cas)!, from: "" };
  }
  return null;
}
const stats = { speciesRead: 0, partRead: 0, processRead: 0, treated: 0, chemotype: 0, isolates: 0 };
for (const e of entries) {
  const cas = e.cas && CAS.test(e.cas) ? e.cas : null;
  if (e.cas && !cas) notes.push(`${e.slug}: CAS «${e.cas}» sin la forma de un CAS; se trata como si no lo diera.`);
  const reject = (reason: string) => pending.push({ slug: e.slug, name: e.name, origin: e.origin, cas: e.cas, supplier: e.supplier ?? e.catalogSource, reason, url: e.url });
  if (e.origin === "natural") {
    const found = speciesOf(e) ?? (cas ? fromCas(cas) : null);
    if (!found) {
      if (cas && !isNaturalCas(cas) && !NATURAL_NAME.test(e.name)) {
        // A natural isolate (Sclareol, γ-terpinene): a pure material whose origin is natural.
        stats.isolates++;
        const sub = substance(cas, e.name);
        classified.push({ entry: e, type: "pure", key: identityKey({ type: "pure", cas: sub === substanceId(cas) || baseSubstances.has(cas) ? (baseSubstances.get(cas)?.cas ?? cas) : cas, isomericForm: "unspecified" }), origin: "natural_isolate", substance: sub, cas });
        continue;
      }
      reject("natural: no se lee la especie en su nombre ni en sus sinónimos");
      continue;
    }
    stats.speciesRead++;
    const allText = [e.name, ...e.synonyms].join(" | ");
    const part = firstOf(PARTS, e.name, found.from);
    const process = firstOf(PROCESSES, e.name, found.from);
    const treatments = TREATMENTS.filter(([re]) => re.test(allText)).map(([, code, name]) => ({ code, name }));
    const chemotype = /\bct\.?\s+([A-Za-z0-9-]+)/.exec(allText)?.[1]?.toLowerCase() ?? null;
    if (part) stats.partRead++;
    if (process) stats.processRead++;
    if (treatments.length) stats.treated++;
    if (chemotype) stats.chemotype++;
    const species = found.species;
    classified.push({
      entry: e,
      type: "natural",
      key: identityKey({ type: "natural", species, part: part?.code, process: process?.code, chemotype, treatments: treatments.map((t) => t.code) }),
      origin: "natural",
      substance: cas ? substance(cas, e.name, "natural_uvcb") : null,
      cas,
      species,
      part,
      process,
      chemotype,
      treatments,
    });
    continue;
  }
  if (cas) {
    const sub = substance(cas, e.name);
    // The identity key is built with the substance's own CAS (an alias resolves to it).
    const own = baseAliases.has(cas) ? [...baseSubstances.values()].find((s) => s.id === sub)?.cas ?? cas : cas;
    classified.push({ entry: e, type: "pure", key: identityKey({ type: "pure", cas: own, isomericForm: "unspecified" }), origin: "synthetic", substance: sub, cas });
    continue;
  }
  const maker = e.supplier ?? e.catalogSource;
  if (maker) {
    const companyRef = company(maker);
    classified.push({ entry: e, type: "blend", key: identityKey({ type: "blend", companyId: companyRef, name: e.name }), origin: "synthetic", substance: null, cas: null, company: companyRef });
    continue;
  }
  reject("sintético sin CAS y sin empresa: ni puro ni mezcla");
}

// ---------------------------------------------------------------- materials, products and claims
const groups = new Map<string, Classified[]>();
for (const c of classified) groups.set(c.key, [...(groups.get(c.key) ?? []), c]);
const multi: Array<[string, Classified[]]> = [];
interface Pending {
  id: string;
  materialId: string;
  productId: string | null;
  attribute: string;
  signature: string;
  slug: string;
  row: Row;
}
const pendingClaims: Pending[] = [];

for (const [key, group] of groups) {
  const first = group.find((g) => !g.entry.supplier) ?? group[0];
  const id = materialId(key);
  if (group.length > 1) multi.push([key, group]);
  const casSet = new Set(group.map((g) => g.cas).filter(Boolean));
  if (casSet.size > 1) conflicts.push({ kind: "natural con varios CAS", key, detail: `${[...casSet].join(" · ")}; se usa ${first.cas} y los demás quedan en sus entradas`, slugs: group.map((g) => g.entry.slug).join(" ") });
  const material: Row = {
    id,
    name: first.entry.name,
    ticker: null,
    ticker_origin: null,
    type: first.type,
    origin: first.origin,
    is_solvent: group.some((g) => g.entry.families.some((f) => f.name === "Solvent") && g.entry.families.length === 1),
    substance_id: first.substance,
    isomeric_form_id: first.type === "pure" ? vocabId("isomeric_form", "unspecified") : null,
    species: first.species ?? null,
    part_id: first.part ? term("part", first.part.code, first.part.name) : null,
    process_id: first.process ? term("process", first.process.code, first.process.name) : null,
    chemotype: first.chemotype ?? null,
    company_id: first.company ?? null,
    identity_key: key,
    merged_into_id: null,
    batch_id: BATCH,
  };
  materials.set(id, material);
  for (const t of first.treatments ?? []) {
    const tid = term("treatment", t.code, t.name);
    naturalTreatments.set(`${id}:${tid}`, { material_id: id, treatment_id: tid, batch_id: BATCH });
  }
  const single = group.length === 1;
  const names = new Set<string>([String(material.name)]);
  for (const c of group) {
    const e = c.entry;
    let productId: string | null = null;
    if (e.supplier && c.type !== "blend") {
      const cid = company(e.supplier);
      productId = uuidFor(`common:product:${id}:${cid}:${normalizeKeyPart(e.name)}`);
      products.set(productId, { id: productId, material_id: id, company_id: cid, trade_name: e.name, code: null, captive: null, grade: null, dilution: null, solvent_material_id: null, status: null, batch_id: BATCH });
    }
    // One entry: what PerfuMate says is about the material. Several: an entry with a supplier speaks for its product.
    const claimProduct = single ? null : productId;
    const addIdentifier = (kind: string, value: string) => {
      const v = value.trim();
      if (!v || (kind !== "trade_name" && names.has(v))) return;
      names.add(v);
      const iid = uuidFor(`common:identifier:${id}:${kind}:${v}`);
      identifiers.set(iid, { id: iid, material_id: id, kind, value: v, source_id: PM, batch_id: BATCH });
    };
    if (e.name !== material.name || productId) addIdentifier(productId ? "trade_name" : "synonym", e.name);
    for (const s of e.synonyms) addIdentifier("synonym", s);
    texts.push({ id: uuidFor(`common:text:perfumate:${e.slug}`), material_id: id, kind_id: vocabId("text_type", "description"), text: e.description, language: "en", source_id: PM, batch_id: BATCH });

    const claim = (attribute: string, fields: Row, terms: Array<[string, string, string | null]> = []) => {
      const cid = uuidFor(`common:claim:perfumate:${e.slug}:${attribute}`);
      const row: Row = {
        id: cid,
        material_id: id,
        product_id: claimProduct,
        attribute_id: attributeId(attribute),
        original_value: null,
        original_unit: null,
        value_min: null,
        value_max: null,
        value_text: null,
        scale_id: null,
        dilution: null,
        solvent_material_id: null,
        temperature_c: null,
        pressure: null,
        support: null,
        source_id: PM,
        derived_from_id: null,
        rank: "normal",
        reason: null,
        quote: e.url,
        batch_id: BATCH,
        ...fields,
      };
      // PerfuMate can name a subfamily twice in one entry, under two families («dry» 67 % and 8 %): one term, the weights added.
      const merged = new Map<string, Row>();
      terms.forEach(([list, vid, fraction], i) => {
        const previous = merged.get(vid);
        if (previous) {
          repeatedTerms++;
          previous.percentage = previous.percentage === null || fraction === null ? null : addDecimals(String(previous.percentage), fraction);
          return;
        }
        merged.set(vid, { id: uuidFor(`${cid}:${vid}`), claim_id: cid, list, vocabulary_id: vid, percentage: fraction, sort: i + 1, batch_id: BATCH });
      });
      claimTerms.push(...merged.values());
      const signature = JSON.stringify([fields.original_value ?? null, fields.value_text ?? null, terms.map((t) => [t[1], t[2]])]);
      pendingClaims.push({ id: cid, materialId: id, productId: claimProduct, attribute, signature, slug: e.slug, row });
    };
    if (e.note) claim("note", { original_value: e.note }, [["note", note(e.note), null]]);
    if (e.category) claim("odor_category", { original_value: e.category, value_text: e.category });
    if (e.families.length)
      claim("families", { original_value: e.families.map(shown).join(", ") }, e.families.map((f) => ["family", family(f.name), weight(f.percentage)]));
    if (e.subcategories.length)
      claim(
        "subfamilies",
        { original_value: e.subcategories.map(shown).join(", ") },
        e.subcategories.map((f) => ["subfamily", listTerm("subfamily", f.name), weight(f.percentage)]),
      );
    if (e.tags.length) claim("descriptors", { original_value: e.tags.join(", ") }, e.tags.map((t) => ["descriptor", listTerm("descriptor", t), null]));
    if (e.impact !== null) claim("potency", { original_value: num(e.impact), scale_id: SCALE });
    if (e.substantivityText || e.substantivityHours !== null)
      claim("duration_strip", {
        original_value: e.substantivityText,
        value_min: e.substantivityHours !== null ? num(e.substantivityHours) : null,
        value_max: e.substantivityHours !== null ? num(e.substantivityHours) : null,
        support: "strip",
      });
    if (e.workingDilution) {
      const values = [...e.workingDilution.matchAll(/(\d+(?:\.\d+)?)\s*%/g)].map((m) => pctToFraction(m[1]));
      if (/\bneat\b/i.test(e.workingDilution)) values.push("1");
      const sorted = values.sort((a, b) => Number(a) - Number(b));
      claim("working_dilution", { original_value: e.workingDilution, value_min: sorted[0] ?? null, value_max: sorted.at(-1) ?? null });
    }
    if (e.constituents.length) {
      const compId = uuidFor(`common:composition:perfumate:${e.slug}`);
      const lines = new Map<string, Row>();
      for (const k of e.constituents) {
        const kc = k.cas && CAS.test(k.cas.trim()) ? k.cas.trim() : null;
        const sid = substance(kc, k.name);
        const value = pct(k.percentage);
        const previous = lines.get(sid);
        if (previous) {
          notes.push(`${e.slug}: ${k.name} sale dos veces en su composición; queda la cifra más alta.`);
          if (Number(previous.value) >= Number(value)) continue;
        }
        if (Number(value) <= 0) {
          notes.push(`${e.slug}: ${k.name} al 0 %; no entra como línea.`);
          continue;
        }
        lines.set(sid, { id: uuidFor(`${compId}:${sid}`), composition_id: compId, substance_id: sid, amount_kind: "unspecified", value, min: null, max: null, defines: false, batch_id: BATCH });
      }
      const total = [...lines.values()].reduce((s, l) => s + Number(l.value), 0);
      if (total > 1 + 1e-9) {
        conflicts.push({ kind: "composición que pasa del 100 %", key, detail: `${e.slug}: suma ${(total * 100).toFixed(2)} %; no entra`, slugs: e.slug });
      } else if (lines.size > 0) {
        compositions.push({
          id: compId,
          material_id: claimProduct ? null : id,
          product_id: claimProduct,
          authority: "literature",
          document_id: null,
          source_id: PM,
          page: null,
          quote: e.url,
          dated_on: e.downloadedAt.slice(0, 10),
          incomplete: total < 1 - 1e-9,
          batch_id: BATCH,
        });
        compositionLines.push(...lines.values());
      }
    }
  }
}

// One star per material, product and attribute: the only claim, or the first of several that agree.
// Several that disagree are «disputed» and go to the user (nothing merges silently).
const byTarget = new Map<string, Pending[]>();
for (const p of pendingClaims) {
  const k = `${p.materialId}|${p.productId ?? ""}|${p.attribute}`;
  byTarget.set(k, [...(byTarget.get(k) ?? []), p]);
}
let disputed = 0;
for (const list of byTarget.values()) {
  const agree = new Set(list.map((p) => p.signature)).size === 1;
  list.forEach((p, i) => {
    p.row.rank = agree ? (i === 0 ? "star" : "normal") : "disputed";
    if (agree && i > 0) p.row.reason = "Dice lo mismo que otra entrada de PerfuMate del mismo material";
  });
  if (!agree) {
    disputed++;
    conflicts.push({
      kind: "afirmaciones distintas de PerfuMate para el mismo material",
      key: String(materials.get(list[0].materialId)!.identity_key),
      detail: `${list[0].attribute}: ${list.map((p) => `${p.slug} → ${p.row.original_value ?? p.row.value_text}`).join(" | ")}`,
      slugs: list.map((p) => p.slug).join(" "),
    });
  }
  claims.push(...list.map((p) => p.row));
}

// ---------------------------------------------------------------- sources, batch, scale
const impacts = entries.map((e) => e.impact).filter((n): n is number => n !== null);
const scales: Row[] = [
  {
    id: SCALE,
    name: "PerfuMate · impact",
    source_id: PM,
    attribute_id: attributeId("potency"),
    min: num(Math.min(...impacts)),
    max: num(Math.max(...impacts)),
    rule: "unconverted",
    points: null,
    batch_id: BATCH,
  },
];
const sources: Row[] = [
  {
    id: PM,
    name: "PerfuMate",
    url: "https://perfumate.app/catalog",
    kind: "web",
    consulted_on: entries.map((e) => e.downloadedAt.slice(0, 10)).sort().at(-1)!,
    notes: `Catalogue scrape (branch perfumate-db, commit ec2f1ab; scraping allowed per its README): ${entries.length} materials. migracion-v3/perfumate/perfumate.sqlite3, sha256 ${sha256}.`,
  },
];
const batches: Row[] = [{ id: BATCH, code: CODE, script: "migracion-v3/tanda-21-perfumate.ts", source_id: PM, status: "proposed", approval: null, commit: null, sha256 }];

// ---------------------------------------------------------------- write
const tables: Array<[string, string[], Row[]]> = [
  ["sources", ["id", "name", "url", "kind", "consulted_on", "notes"], sources],
  ["batches", ["id", "code", "script", "source_id", "status", "approval", "commit", "sha256"], batches],
  ["vocabularies", ["id", "list", "code", "name", "parent_id", "color", "sort", "batch_id"], [...vocabularies.values()]],
  ["equivalences", ["id", "source_id", "source_term", "list", "vocabulary_id", "note", "batch_id"], [...equivalences.values()]],
  ["companies", ["id", "name", "role", "country_id", "website", "batch_id"], [...companies.values()]],
  ["substances", ["id", "cas", "name", "kind", "formula", "molecular_weight", "smiles", "inchikey", "pubchem_cid", "batch_id"], [...substances.values()]],
  ["scales", ["id", "name", "source_id", "attribute_id", "min", "max", "rule", "points", "batch_id"], scales],
  [
    "materials",
    ["id", "name", "ticker", "ticker_origin", "type", "origin", "is_solvent", "substance_id", "isomeric_form_id", "species", "part_id", "process_id", "chemotype", "company_id", "identity_key", "merged_into_id", "batch_id"],
    [...materials.values()],
  ],
  ["natural_treatments", ["material_id", "treatment_id", "batch_id"], [...naturalTreatments.values()]],
  ["identifiers", ["id", "material_id", "kind", "value", "source_id", "batch_id"], [...identifiers.values()]],
  ["material_texts", ["id", "material_id", "kind_id", "text", "language", "source_id", "batch_id"], texts],
  ["products", ["id", "material_id", "company_id", "trade_name", "code", "captive", "grade", "dilution", "solvent_material_id", "status", "batch_id"], [...products.values()]],
  ["compositions", ["id", "material_id", "product_id", "authority", "document_id", "source_id", "page", "quote", "dated_on", "incomplete", "batch_id"], compositions],
  ["composition_lines", ["id", "composition_id", "substance_id", "amount_kind", "value", "min", "max", "defines", "batch_id"], compositionLines],
  [
    "claims",
    ["id", "material_id", "product_id", "attribute_id", "original_value", "original_unit", "value_min", "value_max", "value_text", "scale_id", "dilution", "solvent_material_id", "temperature_c", "pressure", "support", "source_id", "derived_from_id", "rank", "reason", "quote", "batch_id"],
    claims,
  ],
  ["claim_terms", ["id", "claim_id", "list", "vocabulary_id", "percentage", "sort", "batch_id"], claimTerms],
];
for (const [name, columns, rows] of tables) writeTable(join(OUT, `${name}.csv`), columns, rows);
writeTable(join(OUT, "revision", "pendientes.csv"), ["id", "slug", "name", "origin", "cas", "supplier", "reason", "url"], pending.map((p) => ({ id: p.slug, ...p })));
writeTable(
  join(OUT, "revision", "conflictos.csv"),
  ["id", "kind", "key", "detail", "slugs"],
  conflicts.map((c, i) => ({ id: String(i + 1).padStart(4, "0"), ...c })),
);
writeTable(
  join(OUT, "revision", "identidades-con-varias-entradas.csv"),
  ["id", "type", "entries", "slugs", "names"],
  multi.map(([key, g]) => ({ id: key, type: g[0].type, entries: g.length, slugs: g.map((c) => c.entry.slug).join(" "), names: g.map((c) => c.entry.name).join(" | ") })),
);

const count = <T>(xs: T[], f: (x: T) => string) => {
  const m = new Map<string, number>();
  for (const x of xs) m.set(f(x), (m.get(f(x)) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};
const byType = count([...materials.values()], (m) => String(m.type));
const naturals = classified.filter((c) => c.type === "natural").length;
const untranslated = [...vocabularies.values()].filter((v) => v.list === "subfamily" || v.list === "descriptor").length;
const report = [
  "# Tanda 21 · PerfuMate en el sistema nuevo",
  "",
  `El catálogo de PerfuMate (${entries.length} entradas, scrape del ${sources[0].consulted_on}) en el esquema nuevo (V3-70; \`docs-v3/sistema-materiales.md\`). Todo lo que dice PerfuMate entra como afirmación suya, con la página como cita. **En revisión: no está aprobada.**`,
  "",
  "## Cuánto entra",
  "",
  `- **${classified.length} de ${entries.length} entradas** entran; **${pending.length} no** (\`revision/pendientes.csv\`): ${count(pending, (p) => String(p.reason))
    .map(([r, n]) => `${n} por «${r}»`)
    .join("; ")}.`,
  `- Dan **${materials.size} materiales**: ${byType.map(([t, n]) => `${n} ${({ pure: "puros", natural: "naturales", blend: "mezclas" } as Record<string, string>)[t]}`).join(", ")}. ${multi.length} identidades reúnen varias entradas (\`revision/identidades-con-varias-entradas.csv\`): el mismo CAS es el mismo puro, y cada entrada con proveedor pasa a ser un producto suyo.`,
  `- ${products.size} productos de ${companies.size} empresas; ${identifiers.size} identificadores (sinónimos y nombres comerciales); ${texts.length} descripciones (en inglés).`,
  `- ${substances.size} sustancias nuevas; las demás ya estaban en la tanda 20 (IFRA).`,
  `- ${compositions.length} composiciones con ${compositionLines.length} líneas, autoridad «literatura» y cifra «sin especificar» (PerfuMate no dice si es típica o máxima): nunca dan «dentro» en IFRA.`,
  `- ${claims.length} afirmaciones con ${claimTerms.length} términos; ${claims.filter((c) => c.rank === "star").length} con ★. ${disputed} grupos no concuerdan y quedan «en disputa», sin ★ (\`revision/conflictos.csv\`).`,
  "",
  "## Lo que infiere el script (propuesta de la sesión)",
  "",
  `- **El tipo.** Origen «natural» de PerfuMate con especie legible → natural; sin especie, con un CAS de molécula y un nombre que no es de aceite ni extracto → puro de origen «natural_isolate» (${stats.isolates}). Origen «synthetic» con CAS → puro; sin CAS y con empresa (proveedor o catálogo) → mezcla.`,
  `- **Los naturales (${naturals}).** La especie sale de un sinónimo en latín («Salvia sclarea absolute»), si su género está en el anexo de IFRA o parece latino y no es un nombre común de PerfuMate: ${stats.speciesRead - bySource.annex - bySource.sibling}. Sin sinónimo en latín, la del CAS en el anexo de IFRA: ${bySource.annex}; la de otra entrada de PerfuMate con el mismo CAS: ${bySource.sibling}. La parte, del nombre: ${stats.partRead}; el proceso: ${stats.processRead}; con tratamientos (FCF, sin terpenos…): ${stats.treated}; con quimiotipo: ${stats.chemotype}. Lo que no se lee queda vacío en la clave, no se supone.`,
  "- **El nombre de la identidad** es el de PerfuMate (en inglés). Para un puro con proveedor es el comercial («Hedione»), no el químico que pide A9: falta traerlo de PubChem.",
  "- **De quién son los datos.** Si un material tiene una sola entrada, lo que dice PerfuMate es del material, aunque nombre un proveedor (el producto se crea igual). Si tiene varias, lo de cada entrada con proveedor va a su producto.",
  "- **Las familias, como las da PerfuMate** (V3-71): cada una es un término suyo, con su nombre en inglés y sin general por encima. Cuáles se unen, o si se simplifican en menos, se decide cuando haya más fuentes. La familia principal de la ficha es la que más suma.",
  `- **Subfamilias repetidas** en una misma entrada (bajo dos familias de PerfuMate): ${repeatedTerms}; quedan como un término con los pesos sumados.`,
  `- **En inglés, tal como vienen** (V3-71): ${untranslated} subfamilias y descriptores, las familias, las notas y las descripciones.`,
  `- **La potencia** (el «impact» de PerfuMate, de ${Math.min(...impacts)} a ${Math.max(...impacts)} en lo descargado) se guarda tal cual, sin pasar a tu escala, que sigue abierta.`,
  "",
  "## Más cosas que mirar",
  "",
  ...[...new Set(notes)].slice(0, 60).map((n) => `- ${n}`),
  ...(new Set(notes).size > 60 ? [`- … y ${new Set(notes).size - 60} más del mismo tipo.`] : []),
  "",
];
writeFileSync(join(OUT, "informe.md"), report.join("\n"), "utf8");
console.log(`${OUT}: ${tables.map(([n, , r]) => `${n} ${r.length}`).join(", ")}; pendientes ${pending.length}, conflictos ${conflicts.length}`);
