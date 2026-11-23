/**
 * Batch 66 (2026-11-23): into YOUR ACCOUNT, never into the common data. The 55 bottles of the Perfumiarz
 * order of 2026-11-19, which has arrived. The user, 2026-11-23: «ya me llego todo» and «el volumen o peso
 * real no se da de alta porque no contamos stock entonces solo tienes que mirar a que % lo venden creo que
 * todo casi lo compre en el mas puro que venden», with the order pasted (product and format of each line).
 *
 * - One version of yours per product (V3-5), on the common material of batches 57 and 64: supplier
 *   Perfumiarz, the product's name and page; «lo tengo» for each. No weights: no stock (V3-37).
 * - A product sold diluted (its name says «5% (IPM)», «80% (DPG)»…): the material stays the pure one and
 *   the dilution lives in a factory bottle, «de fábrica, al X %», without weights (as batch 42).
 * - Purity: only Ambrostar's «1 g / 100% pure» says it; the rest, empty (the shop does not state it).
 * - The category 4 ceiling of the manufacturer's IFRA certificate that Perfumiarz links for that product
 *   (batch 60, documentos.csv) goes to your version as the product's ceiling (V3-39, P62); the one of a
 *   factory dilution (Ultravanil 80 % DPG) is of the dilution, not of the pure material: not used.
 * Approved with `aprobar.ts --cuenta`, loaded with
 * `cargar-laboratorio.ts <your email> --nube --tanda=66-tus-frascos-perfumiarz-19-nov` (after batches 64 and 65).
 *
 *   node migracion-v3/tanda-66-tus-frascos-perfumiarz-19-nov.ts
 */
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const TANDA = "66";
const OUT = "migracion-v3/tandas/66-tus-frascos-perfumiarz-19-nov";
const SAID = "el usuario, 2026-11-23: «ya me llego todo»; «el volumen o peso real no se da de alta porque no contamos stock entonces solo tienes que mirar a que % lo venden»";
const ARRIVED = "2026-11-23";
type Rec = Record<string, Cell>;
const BASE = process.env.BASE ?? execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
const show = (path: string) => execSync(`git show ${BASE}:${path}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const materialsText = show("v3/datos/materials.csv");
const header = materialsText.slice(0, materialsText.indexOf("\n")).split(",");
const common = new Map((parseCsvRecords(materialsText) as Rec[]).filter((m) => !m.owner_id).map((m) => [String(m.id), m]));
const local = (p: string) => parseCsvRecords(readFileSync(p, "utf8")) as Record<string, string>[];
const lista = local("migracion-v3/web/info-64/lista.csv");
const certs = local("migracion-v3/web/info-18-nov/documentos.csv").filter((d) => d.campo === "tope_cat4");

// The order as the user pasted it (2026-11-23): product → format.
const FORMAT: Readonly<Record<string, string>> = Object.fromEntries(
  `2-Methyl Pyrazine 5% (IPM)|5 g;Wool Absolute|5 g;Frangipani Bold Base|5 g;Fig Base|5 g;Matcha Ketone 5% (TEC)|2.5 g;Yuzu Distilled|2,5 g;Bornyl Acetate|5 g;Ginger Oil Fresh (Madagascar)|2.5 g;Melonal|5 g;Ambrox DL|5 g;Hedione® HC|20 g;Muscenone®|2.5 g;Amber Xtreme™|2,5 g;Hot Milk Bold Base|10 g;Jasmal|10 g;Patchouli Crude Organic (Madagascar)|5 g;Ylang Ylang Oil Extra|2.5 g;Ambrostar®|1 g / 100% pure;Edenolide|5 g;Scentolide|2,5 g;Delta Decalactone|5 g;Petitgrain Bigarade|5 g;Oxyoctaline Formate|2.5 g;Hercolyn DW|5 g;Cuir 17500|5 g;Ylanganate|10 g;Veraspice™|10 g;Velvione™|2.5 g;Ultravanil 80% (DPG)|2,5 g;Tropicalia™|5 g;Thujopsene natural|5 g;Pear Bold Base|10 g;Paradisamide|5 g;Olibanum Oil (Oman)|5 g;Meta Cresol 10 % (DPG)|5 g;Gamma Valerolactone|5 g;Furfuryl Mercaptan 1% (DPG)|5 g;Fructalate|5 g;Ethyl Linalool|10 g;Hydroxyambran 50% (IPM)|10 g;Cinnamalva 50% (DPG)|5 g;Ethyl Pelargonate|10 g;Orionide™ Oliffac|5 g;Isolongifolene|5 g;Ambrocenide Crystals|2,5 g;Levistamel 25% (TEC)|2.5 g;Ambroxan® (powder)|5 g;Oakwood Chip SFE|2.5 g;Cocoa Thiazole 10% (IPM)|2.5 g;Ysamber® K|20 g;Trisamber®|5 g;Ambrox Super (powder)|10 g;Coffee Absolute|2.5 g;Jasmin Floraline 99|2.5 g;Muscone|`
    .split(";").map((x) => x.split("|") as [string, string]),
);
const DILUENT: Readonly<Record<string, { id: string; name: string }>> = {
  DPG: { id: "2027b1c9-0d48-5111-b189-2011b3fef123", name: "DPG" },
  IPM: { id: "cf125c5d-97fa-5752-a44b-642f7f3361f9", name: "IPM" },
  TEC: { id: "baae0ff9-eb1b-59e5-9e4e-31f84686acdb", name: "TEC" },
};
for (const d of Object.values(DILUENT)) if (common.get(d.id)?.solvent !== true && common.get(d.id)?.solvent !== "true") throw new Error(`${d.name}: no es un disolvente común`);

const versions: Rec[] = [];
const have: Rec[] = [];
const bottles: Rec[] = [];
const diluents: Rec[] = [];
const regulations: Rec[] = [];
const lines: string[] = [];
if (lista.length !== Object.keys(FORMAT).length) throw new Error(`lista.csv: ${lista.length} productos; el pedido pegado, ${Object.keys(FORMAT).length}`);
for (const x of lista) {
  if (!(x.producto in FORMAT)) throw new Error(`${x.producto}: no está en el pedido pegado`);
  const c = common.get(x.material_id);
  if (!c) throw new Error(`${x.producto}: ${x.material_id} no es un común de ${BASE}`);
  const id = uuidFor(`tuya:tanda${TANDA}:${x.n}`);
  const format = FORMAT[x.producto];
  const pure = /100% pure/.test(format);
  const dil = x.producto.match(/(\d+(?:[.,]\d+)?)\s*%\s*\((DPG|IPM|TEC)\)/);
  versions.push({
    ...Object.fromEntries(header.map((h) => [h, null])),
    id, owner_id: null, name: x.producto, kind: c.kind, solvent: false, aliases: [], other_cas: [], disputed_fields: [],
    category_id: c.category_id, based_on_id: c.id, supplier: "Perfumiarz", product: x.producto, product_url: x.url_producto || null,
    purity: pure ? "1" : null,
    notes: `Bought from Perfumiarz (order of 2026-11-19, arrived ${ARRIVED}), format «${format || "—"}» (no stock is kept: V3-37).${dil ? ` Sold diluted: ${dil[1]} % in ${dil[2]}; the material is the pure one and the dilution is its factory bottle.` : ""}`,
    sources: `${SAID}. The order, pasted by the user: «${x.producto}${format ? ` · ${format}` : ""}»${pure ? " (purity: «100% pure»)" : ""}`,
  });
  have.push({ id: uuidFor(`tengo:tanda${TANDA}:${id}`), user_id: null, material_id: id });
  let bottle = "—";
  if (dil) {
    const share = Number(dil[1].replace(",", ".")) / 100;
    const bid = uuidFor(`frasco:tanda${TANDA}:${x.n}`);
    const d = DILUENT[dil[2]];
    bottles.push({
      id: bid, user_id: null, material_id: id, fraction: String(share), solvent: null, made_on: ARRIVED,
      description: `De fábrica, al ${dil[1]} % en ${d.name} (Perfumiarz: «${x.producto}»); registrado el ${ARRIVED}, sin pesar.`,
      label: `de fábrica, al ${dil[1]} %`, material_mass_ug: null, source_dilution_id: null, archived_at: null,
    });
    diluents.push({ id: uuidFor(`frasco:${bid}:${d.id}`), dilution_id: bid, user_id: null, diluent_id: d.id, mass_ug: null, fraction: String(Number((1 - share).toPrecision(6))), position: 0 });
    bottle = `de fábrica, al ${dil[1]} % en ${d.name}`;
  }
  let cap = "—";
  const cert = certs.find((d) => d.n === x.n);
  if (cert && cert.valor) {
    if (dil) cap = `${cert.valor} % del producto diluido: no se usa`;
    else {
      const v = Number(cert.valor.replace(",", ".")) / 100;
      regulations.push({
        id: uuidFor(`regulation:v3:tanda${TANDA}:${x.n}`), material_id: id, owner_id: null, regime: "manufacturer", category: "4", kind: "max",
        max_value: String(Number(v.toPrecision(6))), group_key: null, requirement: null, authority: "product",
        source: `${c.house ?? "The manufacturer"}, IFRA certificate («${cert.producto_doc}»), ${cert.url}, page ${cert.pagina}: «${cert.frase}»; linked by Perfumiarz on the product's page (batch 60); the product's ceiling (V3-39, P62); batch ${TANDA}`,
      });
      cap = `${Number((v * 100).toPrecision(6))} %`;
    }
  } else if (cert) cap = cert.estado;
  lines.push(`| ${x.n} | ${x.producto} | ${c.name} | ${format || "—"} | ${pure ? "100 %" : "—"} | ${bottle} | ${cap} |`);
}
mkdirSync(OUT, { recursive: true });
writeTable(join(OUT, "materials.csv"), header, versions);
writeTable(join(OUT, "regulations.csv"), ["id", "material_id", "owner_id", "regime", "category", "kind", "max_value", "group_key", "requirement", "authority", "source"], regulations);
writeTable(join(OUT, "lab_materials.csv"), ["id", "user_id", "material_id"], have);
writeTable(join(OUT, "lab_dilutions.csv"), ["id", "user_id", "material_id", "fraction", "solvent", "made_on", "description", "label", "material_mass_ug", "source_dilution_id", "archived_at"], bottles);
writeTable(join(OUT, "lab_dilution_diluents.csv"), ["id", "dilution_id", "user_id", "diluent_id", "mass_ug", "fraction", "position"], diluents);
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 66 · Tus 55 frascos del pedido de Perfumiarz del 19-nov, en tu cuenta

*Generada por \`migracion-v3/tanda-66-tus-frascos-perfumiarz-19-nov.ts\` sobre lo común de \`${BASE}\`. De tu cuenta: se aprueba con \`--cuenta\` y se carga desde tu PC con \`cargar-laboratorio.ts <correo> --nube --tanda=66-tus-frascos-perfumiarz-19-nov\`. Sin aprobar.*

**Por qué:** ${SAID}; y el pedido que pegaste (producto y formato de cada línea).

**Qué:** ${versions.length} versiones tuyas (proveedor Perfumiarz, el producto y su página), cada una con «lo tengo»; sin pesos (no se lleva stock). ${bottles.length} frascos «de fábrica» para lo que Perfumiarz vende diluido (el material sigue siendo el puro, como en la tanda 42). ${regulations.length} topes de categoría 4 del certificado del fabricante que Perfumiarz enlaza (V3-39): son del producto y no deciden las dos lecturas de IFRA; se ven aparte. La pureza solo la dice Ambrostar («100% pure»); en el resto queda vacía.

**A mirar:** Ambrox DL, Ambroxan y Ambrox Super son tres frascos tuyos del mismo común, Ambermor (tanda 57). El tope de Ultravanil (0,12 %) es del producto al 80 % en DPG: no se usa en el puro. Wool Absolute no lleva nada propio: hereda la marca de la tanda 65 («no declara restringidas», supuesto); si en la caja vino el certificado de tu lote, pásamelo y queda acreditada.

| n | Producto | Común | Formato | Pureza | Frasco | Tope cat. 4 |
|---|---|---|---|---|---|---|
${lines.join("\n")}
`,
  "utf8",
);
console.log(`Tanda ${TANDA}: ${versions.length} versiones, ${have.length} «lo tengo», ${bottles.length} frascos de fábrica, ${regulations.length} topes.`);
