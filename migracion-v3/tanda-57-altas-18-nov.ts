/**
 * Batches 57 and 58 (2026-11-19), from the bandeja of the lab's session of 17–18 November («Planificar
 * diluciones y altas de materiales»):
 *
 * - Batch 57, common: (a) Maese Lab's cinnamon tincture (product 461 of batch 45), which batch 56 left out
 *   because it had been paired with the bark oil; (b) the 55 products of the Perfumiarz order of
 *   2026-11-18, from what each one's page says (migracion-v3/web/perfumiarz-pedido-18-nov/fichas.csv,
 *   read by leer.py). A product whose material is already common only marks it «Perfumiarz sells it»
 *   (as batch 56 did for Maese Lab); the rest are new common materials, with what the page says and
 *   nothing else: the search for the full sheet is the information line, after this.
 * - Batch 58, your account: your Maese Lab specification of six materials, with «I have it»
 *   (bandeja, section 3: «Ahora solo los de Maese»; tocopherol, the user 2026-11-18: «Maese Lab»).
 *   The Perfumiarz products are not yours yet: they go when the order arrives.
 *
 * It stands on the common data of git HEAD and rewrites materials.csv and material_categories.csv
 * whole (57); 58 writes only your rows.
 *
 *   node migracion-v3/tanda-57-altas-18-nov.ts
 */
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable, asCells } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

type Rec = Record<string, Cell>;
const OUT_COMMON = "migracion-v3/tandas/57-altas-18-nov";
const OUT_ACCOUNT = "migracion-v3/tandas/58-tus-altas-maese-18-nov";
const BANDEJA = "bandeja del laboratorio, 2026-11-18 (hilo «Planificar diluciones y altas de materiales»)";

/** The id of your batch-58 version of a material, by its key below: batch 59 hangs its bottles from them. */
export const versionId = (key: string) => uuidFor(`tuya:tanda58:${key}`);

const BASE = (() => {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "HEAD";
  }
})();
const fromFile = (name: string) => {
  const text = execSync(`git show ${BASE}:v3/datos/${name}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] };
};

// ——— Batch 57 (a): Maese Lab's cinnamon tincture ———————————————————————————————————————————————

const MAESE_CINNAMON = "https://maeselab.com/extracto-de-canela-tintura/";
const maese = (url: string, phrase: string) => `Maese Lab, ${url}: «${phrase}»`;
const cinnamonTincture = (header: readonly string[]): Rec => ({
  ...Object.fromEntries(header.map((h) => [h, null])),
  id: uuidFor("comun:tanda57:maese:461"),
  owner_id: null,
  name: "Ceylon cinnamon (bark), tincture",
  kind: "natural",
  solvent: false,
  aliases: ["Extracto de Canela - Tintura", "Cinnamon bark tincture"],
  cas: "84649-98-9",
  other_cas: [],
  species: "Cinnamomum verum",
  part: "bark (Maese Lab: «Corteza»)",
  process: "maceration in alcohol (tincture) (Maese Lab: «obtenido a partir de la maceración de la corteza de Cinnamomum verum en alcohol»)",
  inci: "alcohol, aqua (and) cinnamomum verum bark extract",
  origin: "CEYLAN (Maese Lab)",
  category_id: uuidFor("cat:v3:tanda57:maese:461"),
  form: "tincture",
  confidence: "low",
  disputed_fields: [],
  notes: [
    "Added on 2026-11-19 (batch 57), from Maese Lab's sheet (batch 45, product 461). Batch 56 had paired it with the bark oil, which is another material: this is the «light» cinnamon of Decision 42, not the bark oil (high cinnamaldehyde), which stays as it is.",
    "Maese Lab: «Graduación: 80º» and «Cargas: 4». The page does not say how much bark is in it: no impact of its own (V3-97) and no composition yet; the IFRA panel says «unknown» for it until there is one (V3-102).",
    "CAS: Maese Lab prints «64-17-5, 7732-18-5 (and) 84649-98-9», ethanol, water and the bark extract: the material keeps the extract's.",
  ].join("\n"),
  sources: [
    `Name: ${maese(MAESE_CINNAMON, "Extracto de Canela - Tintura")}`,
    `Species: ${maese(MAESE_CINNAMON, "INCI: alcohol, aqua (and) cinnamomum verum bark extract")}`,
    `Part: ${maese(MAESE_CINNAMON, "Parte: Corteza")}`,
    `Origin: ${maese(MAESE_CINNAMON, "Origen: CEYLAN")}`,
    `CAS: ${maese(MAESE_CINNAMON, "Nº CAS: 64-17-5, 7732-18-5 (and) 84649-98-9")}`,
    `Maese Lab sells it: «Extracto de Canela - Tintura», ${MAESE_CINNAMON}`,
  ].join(" · "),
});

// ——— Batch 57 (b): the Perfumiarz order ————————————————————————————————————————————————————————

/**
 * Each product, read by the session against the common data (proposal of the session, for the user to
 * approve): `common` is the id of the common it is (same CAS, or the same species, part and process,
 * V3-85); otherwise `name` and `kind` of the new common. `form` for a natural; `cas` when the page's
 * CAS field mixes in the solvent's.
 */
const PLAN: Readonly<Record<string, { common?: string; why?: string; name?: string; kind?: "molecule" | "natural" | "composition"; form?: string; species?: string; part?: string; process?: string; cas?: string; synthesis?: string; hold?: string }>> = {
  "1": { name: "2-Methylpyrazine", kind: "molecule" },
  "2": { name: "Wool, absolute", kind: "natural", form: "absolute" },
  "3": { name: "Frangipani Bold Base (Moellhausen)", kind: "composition", form: "base" },
  "4": { name: "Fig Base (PCW)", kind: "composition", form: "base" },
  "5": { name: "Matcha Ketone", kind: "molecule" },
  "6": { name: "Yuzu peel, distilled essential oil", kind: "natural", form: "essential oil", species: "Citrus junos", part: "peel (INCI «CITRUS JUNOS PEEL OIL»)", process: "distillation (Perfumiarz names it «Yuzu Distilled»; no document says it yet)" },
  "7": { name: "Bornyl acetate", kind: "molecule" },
  "8": { common: "0cdb7271-", why: "the same CAS 8007-08-7 and Zingiber officinale root oil; «Fresh» is a grade" },
  "9": { common: "5d5e6db1-", why: "CAS 106-72-9, already common as «Melon heptenal» (alias Melonal)" },
  "10": { common: "beb2bf23-", why: "CAS 3738-00-9, the racemic ambroxide, already common as Ambermor (it lists 3738-00-9)" },
  "11": { common: "6bc36ada-", why: "CAS 24851-98-7, Hedione; HC (high cis) is another grade of the same molecule (bandeja: «otro grado: producto nuevo»)" },
  "12": { name: "Muscenone", kind: "molecule" },
  "13": { common: "97c08b4d-", why: "CAS 476332-65-7, already common as «Musk indenofuran» (alias Amber Xtreme)" },
  "14": { name: "Hot Milk Bold Base (Moellhausen)", kind: "composition", form: "base" },
  "15": { name: "Jasmal", kind: "molecule" },
  "16": { common: "ad12f677-", why: "CAS 8014-09-3, Pogostemon cablin leaf oil: the common Patchouli («crude», «organic» and Madagascar are grade and origin)" },
  "17": { common: "f27a6a35-", why: "Cananga odorata flower oil, extra (CAS 8006-81-3 among its CAS)" },
  "18": { name: "Ambrostar", kind: "molecule" },
  "19": { name: "Edenolide", kind: "molecule" },
  "20": { name: "Scentolide", kind: "molecule" },
  "21": { name: "Delta-decalactone", kind: "molecule" },
  "22": { common: "6e302f4c-", why: "Citrus aurantium amara leaf oil, the common «Petitgrain bigarade, essential oil» (Perfumiarz gives CAS 8014-17-3; the common, 68916-04-1)" },
  "23": { name: "Oxyoctaline formate", kind: "molecule" },
  "24": { name: "Hercolyn DW (methyl hydrogenated rosinate)", kind: "molecule" },
  "25": { name: "Cuir 17500 (Synarome)", kind: "composition", form: "base" },
  "26": { name: "Ylanganate", kind: "molecule" },
  "27": { name: "Veraspice", kind: "molecule" },
  "28": { name: "Velvione", kind: "molecule" },
  "29": { name: "Ultravanil", kind: "molecule" },
  "30": { hold: "Perfumiarz has no page for it today, so not even its kind is known: it waits for the information line" },
  "31": { name: "Thujopsene", kind: "molecule", synthesis: "natural" },
  "32": { name: "Pear Bold Base (Moellhausen)", kind: "composition", form: "base" },
  "33": { common: "938af120-", why: "CAS 406488-30-0, already common" },
  "34": { name: "Frankincense (Boswellia carterii), essential oil", kind: "natural", form: "essential oil", species: "Boswellia carterii", part: "gum (INCI «BOSWELLIA CARTERII GUM OIL»)" },
  "35": { name: "meta-Cresol", kind: "molecule" },
  "36": { name: "Gamma-valerolactone", kind: "molecule" },
  "37": { name: "Furfuryl mercaptan", kind: "molecule" },
  "38": { name: "Fructalate", kind: "molecule" },
  "39": { name: "Ethyl linalool", kind: "molecule" },
  "40": { name: "Hydroxyambran", kind: "molecule" },
  "41": { name: "Cinnamalva (cinnamyl nitrile)", kind: "molecule" },
  "42": { name: "Ethyl pelargonate", kind: "molecule" },
  "43": { name: "Orionide", kind: "molecule" },
  "44": { name: "Isolongifolene", kind: "molecule" },
  "45": { name: "Ambrocenide", kind: "molecule" },
  "46": { name: "Levistamel", kind: "molecule", cas: "675-09-2" },
  "47": { common: "beb2bf23-", why: "CAS 6790-58-5, Ambroxan: the common Ambermor carries it (aliases «Ambroxan», «Ambrox Super (Firmenich)»)" },
  "48": { name: "Oak wood (chips), CO2 extract", kind: "natural", form: "CO2 extract", part: "wood chips", process: "supercritical CO2 extraction (Perfumiarz names it «SFE»)" },
  "49": { name: "Cocoa thiazole (trimethylthiazole)", kind: "molecule" },
  "50": { name: "Ysamber K", kind: "molecule" },
  "51": { name: "Trisamber", kind: "molecule" },
  "52": { common: "beb2bf23-", why: "CAS 6790-58-5: the common Ambermor carries «Ambrox Super (Firmenich)» among its names" },
  "53": { name: "Coffee, absolute", kind: "natural", form: "absolute", species: "Coffea arabica", part: "seed (INCI «COFFEA ARABICA SEED EXTRACT»)", process: "solvent extraction (absolute)" },
  "54": { name: "Jasmin Floraline 99 (Robertet)", kind: "composition", form: "base" },
  "55": { name: "Muscone", kind: "molecule" },
};

/** The note the page gives, in the app's tiers. */
const TIER: Readonly<Record<string, string>> = { Głowa: "top", "Głowa / Serce": "top_heart", Serce: "heart", "Serce / Baza": "heart_base", Baza: "base" };
/** The page's form, in English, with the page's words. */
const FORM_WORDS: Readonly<Record<string, string>> = {
  "Bezbarwna ciecz": "colourless liquid",
  "Jasnożółta ciecz": "pale yellow liquid",
  "Jasnobrązowa ciecz": "light brown liquid",
  "Jasnosłomkowa ciecz": "pale straw liquid",
  "Brązowa lepka pasta": "brown sticky paste",
  "Biała substancja stała": "white solid",
  "Białe kryształy": "white crystals",
  "Białe płatki": "white flakes",
  "Brown paste": "brown paste",
};
const stateOf = (forma: string) => {
  if (!forma) return null;
  const words = FORM_WORDS[forma] ?? Object.entries(FORM_WORDS).find(([pl]) => forma.startsWith(pl))?.[1];
  return words ? `${words} (Perfumiarz: «${forma}»)` : `Perfumiarz: «${forma}»`;
};

const order = parseCsvRecords(readFileSync("migracion-v3/web/perfumiarz-pedido-18-nov/pedido.csv", "utf8"));
const pages = new Map(parseCsvRecords(readFileSync("migracion-v3/web/perfumiarz-pedido-18-nov/fichas.csv", "utf8")).map((r) => [r.n, r]));

const materials = fromFile("materials.csv");
const categories = fromFile("material_categories.csv");
const common = materials.rows.filter((m) => !m.owner_id);
const byPrefix = (prefix: string) => {
  const hit = common.filter((m) => String(m.id).startsWith(prefix));
  if (hit.length !== 1) throw new Error(`${prefix}: ${hit.length} comunes`);
  return hit[0];
};
const casList = (text: string) => text.split("/").map((s) => s.trim()).filter((s) => /^\d{2,7}-\d\d-\d$/.test(s));
const docs = (p: Record<string, string>) =>
  [["SDS", p.sds], ["IFRA", p.ifra], ["EU allergens", p.eu_allergens], ["CoA", p.coa]].filter(([, url]) => url).map(([k, url]) => `${k}: ${url}`);

const newMaterials: Rec[] = [cinnamonTincture(materials.header)];
const newCategories: Rec[] = [{ id: uuidFor("cat:v3:tanda57:maese:461"), name: "Ceylon cinnamon (bark), tincture", aliases: [] }];
const marked = new Map<string, string[]>();
const lines: string[] = [];
const matched: string[] = [];
const held: string[] = [];

for (const o of order) {
  const plan = PLAN[o.n];
  const p = pages.get(o.n) ?? ({} as Record<string, string>);
  if (!plan) throw new Error(`Producto ${o.n} sin plan`);
  const sells = p.url ? `Perfumiarz sells it: «${String(p.titulo).replace(/ – Perfumiarz$/, "")}», ${p.url}` : null;
  if (plan.hold) {
    held.push(`| ${o.n} | ${o.producto} | ${plan.hold} |`);
    continue;
  }
  if (plan.common) {
    const m = byPrefix(plan.common);
    if (sells) marked.set(String(m.id), [...(marked.get(String(m.id)) ?? []), sells]);
    matched.push(`| ${o.n} | ${o.producto} | ${m.name} | ${plan.why} |`);
    continue;
  }
  if (!p.url && !["18", "43"].includes(o.n)) throw new Error(`Producto ${o.n} sin página`);
  const say = (label: string, value: string) => `Perfumiarz, ${p.url}: «${label} ${value}»`;
  const cas = plan.cas ?? (casList(p.cas ?? "").length === 1 ? casList(p.cas ?? "")[0] : null);
  const otherCas = plan.cas ? [] : casList(p.cas ?? "").slice(1);
  if (plan.kind === "molecule" && cas && common.some((m) => m.cas === cas || String(m.other_cas ?? "").includes(cas))) throw new Error(`${o.producto}: el CAS ${cas} ya es común`);
  const id = uuidFor(`comun:tanda57:perfumiarz:${o.n}`);
  const category = uuidFor(`cat:v3:tanda57:perfumiarz:${o.n}`);
  const house = p.producent && p.producent !== "Other" ? p.producent : null;
  const tier = TIER[p.nuta ?? ""] ?? null;
  const strengthText = p.moc ? `Perfumiarz gives «MOC ZAPACHU: ${p.moc}» (the shop's own scale, not PerfuMate's impact: V3-97 keeps it out of the impact).` : null;
  const diluted = /\d+\s*%/.test(o.producto) && o.concentracion_bandeja !== "puro" ? `Perfumiarz sells it diluted: «${o.producto}» (${o.concentracion_bandeja}); the common is the neat material, the dilution goes in your specification when it arrives.` : null;
  newCategories.push({ id: category, name: plan.name!, aliases: [] });
  newMaterials.push({
    ...Object.fromEntries(materials.header.map((h) => [h, null])),
    id,
    owner_id: null,
    name: plan.name!,
    kind: plan.kind!,
    solvent: false,
    aliases: [...new Set([o.producto, String(p.titulo ?? "").replace(/ – Perfumiarz$/, "")].filter((x) => x && x !== plan.name))],
    cas,
    other_cas: otherCas,
    species: plan.species ?? null,
    part: plan.part ?? null,
    process: plan.process ?? null,
    inci: p.inci && p.inci !== "-" ? p.inci : null,
    category_id: category,
    form: plan.form ?? null,
    house,
    synthesis: plan.synthesis ?? null,
    tier,
    physical_state: stateOf(p.forma ?? ""),
    confidence: "low",
    disputed_fields: o.n === "44" ? ["cas"] : [],
    notes: [
      `Added on 2026-11-19 (batch 57), from the Perfumiarz order of 2026-11-18 (${BANDEJA}) and what the product's page says; the rest of the sheet comes from the information line.`,
      ...(p.url ? [] : [`Perfumiarz has no page for it today (${p.titulo ?? "not found"}): only its name and the bandeja's type («${o.tipo_bandeja}»).`]),
      ...(diluted ? [diluted] : []),
      ...(strengthText ? [strengthText] : []),
      ...(p.opis ? [`Perfumiarz describes it: «${p.opis}».`] : []),
      ...(o.n === "44" ? ["The page says «CAS#: 1135-66-6» (isolongifolene) but «INCI: ISOLONGIFOLANONE» (another molecule): which one the bottle is, to be confirmed."] : []),
      ...(o.n === "46" ? ["The page gives «CAS#: 675-09-2 / 77-93-0»: 77-93-0 is TEC, its solvent."] : []),
      ...(docs(p).length ? [`Documents on the page (not read yet): ${docs(p).join(" · ")}.`] : []),
    ].join("\n"),
    sources: [
      ...(p.url ? [`Name: Perfumiarz, ${p.url}: «${String(p.titulo).replace(/ – Perfumiarz$/, "")}»`] : []),
      ...(cas && p.cas ? [`CAS: ${say("CAS#:", p.cas)}`] : []),
      ...(p.inci && p.inci !== "-" ? [`INCI: ${say("INCI:", p.inci)}`] : []),
      ...(house ? [`House: ${say("PRODUCENT:", house)}`] : []),
      ...(tier ? [`Tier: ${say("NUTA:", p.nuta)}`] : []),
      ...(p.forma ? [`State: ${say("FORMA:", p.forma)}`] : []),
      ...(sells ? [sells] : []),
    ].join(" · "),
  });
  lines.push(`| ${o.n} | ${o.producto} | ${plan.name} | ${plan.kind} | ${cas ?? "—"} | ${house ?? "—"} | ${tier ?? "—"} | ${p.moc ?? "—"} | ${docs(p).map((d) => d.split(":")[0]).join(", ") || "—"} |`);
}

const updated = asCells(materials.rows).map((m) => {
  const add = marked.get(String(m.id));
  if (!add) return m;
  const now = String(m.sources ?? "");
  const fresh = add.filter((s) => !now.includes(s));
  return fresh.length ? { ...m, sources: [now, ...fresh].filter(Boolean).join(" · ") } : m;
});
for (const m of newMaterials) if (updated.some((u) => u.id === m.id)) throw new Error(`${m.name}: su id ya existe`);
mkdirSync(OUT_COMMON, { recursive: true });
writeTable(join(OUT_COMMON, "materials.csv"), materials.header, [...updated, ...newMaterials]);
writeTable(join(OUT_COMMON, "material_categories.csv"), categories.header, [...asCells(categories.rows), ...newCategories]);

// ——— Batch 58: your six of Maese Lab ————————————————————————————————————————————————————————————

const VERSIONS: ReadonlyArray<{ key: string; common: string; name: string; product: string; url: string; purity: string | null; said: string; note?: string }> = [
  { key: "citronellol", common: "dda00385-", name: "Citronellol 96%", product: "Citronellol 96%", url: "https://maeselab.com/citronellol-96/", purity: "0.96", said: "PUREZA 96%" },
  { key: "sandaltouch", common: "19f1ffa9-", name: "Sandaltouch", product: "Sandaltoch - Simil Sandalore", url: "https://maeselab.com/sandaltoch-simil-sandalore/", purity: "1", said: "SANDALTOUCH (SANDALORE) · INCI: PENTAMETHYLCYCLOPENT-3-ENE-BUTANOL · Nº CAS: 65113-99-7 · PUREZA 100%", note: "The molecule, confirmed by its sheet (bandeja: «Confirmar la molécula con su ficha»): CAS 65113-99-7, Sandalore's." },
  { key: "osmanthus", common: "befdfa36-", name: "Osmanthus absolute", product: "Absoluto de Osmanthus", url: "https://maeselab.com/absoluto-de-osmanthus/", purity: "1", said: "ABS. Osmanthus · Origen: CHINA · PUREZA 100%" },
  { key: "alpha-pinene", common: "7177d7ca-", name: "Alpha-pinene", product: "Alfa Pineno", url: "https://maeselab.com/alfa-pineno/", purity: null, said: "ALFA PINENO 95 % · Nº CAS: 7785-26-4 · PUREZA 95%", note: "Purity left empty: Maese Lab's page says «PUREZA 95%» and the bandeja «Alfa pineno 98 %». Your label decides." },
  { key: "cinnamon-tincture", common: "", name: "Cinnamon tincture", product: "Extracto de Canela - Tintura", url: MAESE_CINNAMON, purity: null, said: "Graduación: 80º", note: "In Decision 42 this tincture was weighed with the bark oil's sheet and counted as neat (the user, 2026-11-18): from now on, this one." },
  { key: "tocopherol", common: "b4b76187-", name: "Tocopherol (vitamin E)", product: "Vitamina E - Tocopherol líquido", url: "https://maeselab.com/vitamina-e-tocopherol-liquido/", purity: null, said: "Vitamina E - Tocopherol líquido", note: "The user, 2026-11-18, to «¿De qué proveedor es tu tocoferol?»: «Maese Lab». Zara Tobacco uses it at 9.99 % in alcohol. Maese Lab does not state its purity (batch 55)." },
];
const versions: Rec[] = VERSIONS.map((v) => {
  const base = v.common ? byPrefix(v.common) : newMaterials[0];
  return {
    ...Object.fromEntries(materials.header.map((h) => [h, null])),
    id: versionId(v.key),
    owner_id: null,
    name: v.name,
    kind: base.kind,
    solvent: false,
    aliases: [],
    other_cas: [],
    disputed_fields: v.key === "alpha-pinene" ? ["purity"] : [],
    category_id: base.category_id,
    based_on_id: base.id,
    supplier: "Maese Lab",
    product: v.product,
    product_url: v.url,
    purity: v.purity,
    notes: v.note ?? null,
    sources: `${BANDEJA}, section 3: «Ahora solo los de Maese». ${maese(v.url, v.said)}`,
  };
});
mkdirSync(OUT_ACCOUNT, { recursive: true });
writeTable(join(OUT_ACCOUNT, "materials.csv"), materials.header, versions);
writeTable(join(OUT_ACCOUNT, "lab_materials.csv"), ["id", "user_id", "material_id"], versions.map((v) => ({ id: uuidFor(`tengo:tanda58:${v.id}`), user_id: null, material_id: v.id })));

// ——— Reports ————————————————————————————————————————————————————————————————————————————————————

writeFileSync(
  join(OUT_COMMON, "informe.md"),
  `# Tanda 57 · Altas del 18-nov en lo común: la tintura de canela de Maese Lab y el pedido de Perfumiarz

*Generada por \`migracion-v3/tanda-57-altas-18-nov.ts\` sobre los datos comunes de \`${BASE}\`. ${BANDEJA}, secciones 2a y 2b. Reescribe \`materials.csv\` y \`material_categories.csv\` enteros. Sin aprobar.*

**Resultado:** ${newMaterials.length} materiales comunes nuevos (la tintura y ${newMaterials.length - 1} de Perfumiarz); ${matched.length} productos de Perfumiarz que ya eran comunes, marcados «Perfumiarz sells it»; ${held.length} en espera. Cada cifra sale de la página del producto (\`migracion-v3/web/perfumiarz-pedido-18-nov/fichas.csv\`, leída por \`leer.py\` el 2026-11-19), con su frase. **Las fichas van a medias, como pide la bandeja:** sin familia, duración, dosis ni composición; eso es la línea de información. Los documentos (SDS, IFRA, alérgenos) se apuntan en las notas y aún no se han leído.

## La tintura de canela (Maese Lab, producto 461)

*Ceylon cinnamon (bark), tincture*: *Cinnamomum verum*, corteza, Ceilán, 80º. Es otro material que el aceite de corteza: la tanda 56 la había dejado fuera porque se emparejó con él. Sin composición ni impacto: el panel de IFRA dirá «desconocido» hasta que se sepa cuánta corteza lleva.

## Los de Perfumiarz que ya eran comunes (solo se marcan)

| n | Producto | Común | Por qué |
|---|---|---|---|
${matched.join("\n")}

**A mirar:** Ambrox DL (racémico, 3738-00-9), Ambroxan y Ambrox Super (el (−)-ambróxido, 6790-58-5) caen los tres en el común Ambermor, que ya junta los dos CAS. Si quieres separarlos, es una decisión aparte.

## Los nuevos

Nota (*tier*), de «NUTA» de la página: Głowa = salida, Serce = corazón, Baza = fondo. «Fuerza» es la «MOC ZAPACHU» de la tienda: va solo en las notas, no como impacto (V3-97).

| n | Producto | Nombre en la app | Tipo | CAS | Fabricante | Nota | Fuerza (tienda) | Documentos |
|---|---|---|---|---|---|---|---|---|
${lines.join("\n")}

- **Ambrostar y Orionide:** Perfumiarz no tiene hoy su página (el buscador la enlaza y da 404): entran solo con su nombre y el tipo de la bandeja.
- **Isolongifolene:** la página da «CAS#: 1135-66-6» (isolongifoleno) e «INCI: ISOLONGIFOLANONE» (otra molécula): CAS en disputa.
- **Levistamel:** la página da «675-09-2 / 77-93-0»; el segundo es el TEC en que viene.
- **Yuzu destilado:** el común que ya había es el de presión en frío (Maese Lab); este es otro proceso, así que es otro material (V3-85). Que es destilado lo dice solo el nombre del producto.
- **Olíbano de Omán:** la página dice *Boswellia carterii*; el olíbano común es *B. sacra*: otro material.
- **Café absoluto:** el común que había es el extracto de CO2: otro material.
- **Diluidos de fábrica** (2-metilpirazina al 5 % en IPM, Matcha Ketone, Ultravanil, meta-cresol, furfuril mercaptano, Hydroxyambran, Cinnamalva, Levistamel, Cocoa Thiazole): lo común es el material puro; el % va en tu especificación cuando llegue el pedido.

## En espera

| n | Producto | Por qué |
|---|---|---|
${held.join("\n")}
`,
  "utf8",
);
writeFileSync(
  join(OUT_ACCOUNT, "informe.md"),
  `# Tanda 58 · Tus seis de Maese Lab del 17-18 nov, en tu cuenta

*Generada por \`migracion-v3/tanda-57-altas-18-nov.ts\`. ${BANDEJA}, sección 3: «Ahora solo los de Maese». De tu cuenta: se aprueba con \`--cuenta\` y se carga con \`cargar-laboratorio.ts <correo> --nube --tanda=58-tus-altas-maese-18-nov\` **después de cargar la tanda 57** (la tintura de canela es común nueva). Sin aprobar.*

Tu especificación de cada uno, tal como la vende Maese Lab, con «lo tengo».

| Tuyo | Sobre el común | Producto de Maese Lab | Pureza |
|---|---|---|---|
${versions.map((v) => `| ${v.name} | ${[...newMaterials, ...common].find((m) => m.id === v.based_on_id)?.name} | ${v.product} | ${v.purity ? `${Number(v.purity) * 100} %` : "no la pone"} |`).join("\n")}

- **El salicilato de bencilo no va:** ya tienes dos en tu cuenta, dados de alta a mano (tanda 39: «si me acabe llevando dos botes peoro bueno no cuento el stock asi que da igual»).
- **Alfa-pineno:** la web de Maese dice «PUREZA 95%» y la bandeja, «98 %». Se deja la pureza vacía hasta que mires la etiqueta.
- **Sandaltouch** es Sandalore (CAS 65113-99-7, según su ficha), como pedía la bandeja confirmar.
- **El tocoferol**, de Maese Lab (tu respuesta del 2026-11-18).
`,
  "utf8",
);
console.log(`Tanda 57: ${newMaterials.length} nuevos, ${matched.length} marcados, ${held.length} en espera. Tanda 58: ${versions.length} tuyos.`);
