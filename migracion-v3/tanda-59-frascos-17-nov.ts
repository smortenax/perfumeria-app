/**
 * Batch 59 (2026-11-19): into YOUR ACCOUNT, never into the common data. The 25 bottles you made on
 * 2026-11-17, by chat and not in the app, as if you had saved them by hand in Dilutions (bandeja del
 * laboratorio, 2026-11-18: «Darlas de alta como si se hubieran hecho a mano en Diluciones, con su fecha
 * (17-nov), material real y disolvente real»). The weights, as the bandeja gives them
 * (migracion-v3/respuestas/frascos-2026-11-17.csv); the exact figure is what was weighed (V3-67).
 * 22 materials are already yours; Citronellol 96 %, Sandaltouch and alpha-pinene are your versions of
 * batch 58, so this batch loads after it.
 * Approved with `aprobar.ts --cuenta`, loaded with `cargar-laboratorio.ts <your email> --nube --tanda=59-frascos-17-nov`.
 *
 *   node migracion-v3/tanda-59-frascos-17-nov.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

/** Your batch-58 versions, by the same key as tanda-57-altas-18-nov.ts (`versionId`); importing it would run that batch. */
const versionId = (key: string) => uuidFor(`tuya:tanda58:${key}`);

const OUT = "migracion-v3/tandas/59-frascos-17-nov";
const SAID = "bandeja del laboratorio, 2026-11-18 (hilo «Planificar diluciones y altas de materiales»): «Darlas de alta como si se hubieran hecho a mano en Diluciones, con su fecha (17-nov), material real y disolvente real»";
const MADE_ON = "2026-11-17";
type Rec = Record<string, Cell>;

const weighed = parseCsvRecords(readFileSync("migracion-v3/respuestas/frascos-2026-11-17.csv", "utf8"));

// The common diluents, as batches 24 and 25 use them.
const ETHANOL = { id: "8c6d2ffa-b0e9-562e-815c-a77973deb67e", name: "Etanol" };
const DPG = { id: "2027b1c9-0d48-5111-b189-2011b3fef123", name: "DPG" };
const DILUENT: Readonly<Record<string, typeof ETHANOL>> = { "Alcohol 96º": ETHANOL, DPG };

// The bandeja's names: your version of each material (batches 8, 17, 39; and 58 for the three new ones).
const MATERIAL: Readonly<Record<string, string>> = {
  "Salicilato de amilo": "6b5e08c0-14da-5574-9161-5d07f1a81cc1", // batch 39, Maese Lab
  "Acetato de bencilo": "6751df4e-5cf5-5a57-ae4b-ab3b62854287", // Maese Lab
  "Aldehído hexil cinámico": "3451a97c-bbf7-5b67-8a94-2b67f18551c6", // Maese Lab
  "Acetato de feniletilo": "60f511b5-e4b6-599f-9bbf-9f9872071704", // batch 39, Maese Lab
  Florosa: "f99c28f7-b203-5d45-8ac5-0d2f3ea37a86", // Maese Lab
  Magnolan: "0c36a484-853d-5d87-ada8-17b9a46bf312", // batch 39, Maese Lab
  "Acetato de linalilo": "32cf0742-b056-56f6-a2db-b8d2e0d1305f", // Perfumiarz
  Norlimbanol: "eccddfdf-b4d2-5f10-aa0b-455e5fe6d354", // Maese Lab
  "Esencia de miel": "b9035207-b7e5-5c68-985e-22c945106f1b", // Maese Lab, «Esencia Aromática de Miel»
  Fructone: "cab6014d-f5d1-5701-b5ec-cf8cd7eb0412", // Maese Lab
  "Citronelol 96 %": versionId("citronellol"), // batch 58
  Aurantiol: "48f5af60-583f-5356-9bf4-5b6c5814f4dc", // batch 39, Maese Lab
  Sandaltouch: versionId("sandaltouch"), // batch 58
  "Metil ionona gamma": "65a301e2-2b63-5be3-a32a-f000f7671217", // Maese Lab
  "Geraniol 98 %": "4f6868f8-fff0-5779-b18a-8913c7c8da77", // Maese Lab
  "Raspberry ketone": "21a9e7bb-3fe4-57e0-8f08-12be5fe67d37", // batch 39, Maese Lab
  "Decanoato de etilo": "a6f65bdb-bc36-510f-8a07-fed352b959b5", // batch 17, Harrison Joseph
  "Absoluto de pimienta negra": "e3ea3b78-c829-5e55-8054-c000d60a82af", // Perfumiarz
  "Linolenato de metilo": "d9f95d5c-865b-52e0-9651-dc04fad44d03", // batch 17, Harrison Joseph
  "Lavanda AE": "12fc05b3-b593-536c-bd52-425a939033fb", // Olfatorium kit
  "Cilantro AE": "3b12a58b-a979-54cf-801a-24293cc20d13", // Olfatorium kit
  "Litsea cubeba AE": "b35aa17c-fc9f-56a9-b363-b394eeb8e853", // Olfatorium kit
  "Alfa-pineno": versionId("alpha-pinene"), // batch 58
  Manzanate: "ae5e0df8-a147-5eea-9bb2-ef753e28cc4e", // batch 39, Maese Lab
  "Aldehído C12 láurico": "6433e25b-6edd-5cf6-89e7-446af6b72baf", // batch 39, «Aldehyde C12 lauric (dodecanal)»
};
const OWN_SOLVENT: Readonly<Record<string, { id: string; name: string }>> = {};

// Exact fractions as the app keeps them (batch 19): bigint, six decimals, half up; µg from the typed grams.
const SCALE = 1_000_000n;
const six = (num: bigint, den: bigint) => (2n * num * SCALE + den) / (2n * den);
const decimal = (millionths: bigint) => ((millionths / SCALE).toString() + "." + (millionths % SCALE).toString().padStart(6, "0")).replace(/\.?0+$/, "");
const microgram = (grams: string) => {
  if (!/^\d+\.\d{3}$/.test(grams)) throw new Error(`«${grams}» no es un peso con tres decimales`);
  return BigInt(grams.replace(".", "")) * 1000n;
};
const ratio = (text: string): [bigint, bigint] => {
  const [whole, frac = ""] = text.split(".");
  const den = 10n ** BigInt(frac.length);
  return [BigInt(whole) * den + BigInt(frac || "0"), den];
};
const NOMINAL = [0.01, 0.1, 0.5, 1, 2, 3, 5, 10, 15, 20, 25, 30, 40, 50, 100];
const labelOf = (fraction: number) => {
  const pct = fraction * 100;
  const near = NOMINAL.find((p) => Math.abs(pct - p) <= p * 0.15);
  return `al ${String(near ?? Number(pct.toFixed(2))).replace(".", ",")} %`;
};
const g = (ug: bigint) => (Number(ug) / 1e6).toFixed(3).replace(".", ",");

const bottles: Rec[] = [];
const diluents: Rec[] = [];
const report: string[] = [];
for (const w of weighed) {
  const materialId = MATERIAL[w.material];
  const added = DILUENT[w.diluyente];
  if (!materialId || !added) throw new Error(`Fila ${w.fila}: «${w.material}» o «${w.diluyente}» sin correspondencia`);
  const productUg = microgram(w.producto_g);
  const addedUg = microgram(w.diluyente_g);
  const [num, den] = ratio(w.viene_al ?? "1");
  if ((productUg * num) % den !== 0n) throw new Error(`Fila ${w.fila}: la masa de material no es exacta en µg`);
  const materialUg = (productUg * num) / den;
  const own = OWN_SOLVENT[w.material];
  if ((num !== den) !== Boolean(own)) throw new Error(`Fila ${w.fila}: «viene al» ${w.viene_al} sin su disolvente, o al revés`);
  const parts = new Map<string, { name: string; massUg: bigint }>();
  const add = (d: typeof ETHANOL, massUg: bigint) => parts.set(d.id, { name: d.name, massUg: (parts.get(d.id)?.massUg ?? 0n) + massUg });
  if (own) add(own, productUg - materialUg);
  add(added, addedUg);
  const total = productUg + addedUg;
  const fraction = six(materialUg, total);
  const rows = [...parts].map(([id, p]) => ({ id, ...p, share: six(p.massUg, total) }));
  // Every share to six decimals adding up to 1: what rounding moves goes to the largest diluent (as the app does).
  const largest = rows.reduce((at, r, i) => (r.share > rows[at].share ? i : at), 0);
  rows[largest].share += SCALE - fraction - rows.reduce((s, r) => s + r.share, 0n);
  // The bandeja gives the exact % to four decimals: what is weighed here must say the same.
  if ((Number(decimal(fraction)) * 100).toFixed(4) !== Number(w.exacto_bandeja).toFixed(4))
    throw new Error(`Fila ${w.fila}: ${(Number(decimal(fraction)) * 100).toFixed(4)} % no es el ${w.exacto_bandeja} % de la bandeja`);
  const id = uuidFor(`frasco:tanda59:${w.fila}`);
  // The bandeja asks for the exact figure where the bottle missed its target («va el exacto»): its name says it too.
  const label = /va el exacto/.test(w.nota ?? "") ? `al ${(Number(decimal(fraction)) * 100).toFixed(2).replace(".", ",")} %` : labelOf(Number(decimal(fraction)));
  const weighedText = `${g(productUg)} g${own ? ` del producto al ${String(Number(w.viene_al) * 100).replace(".", ",")} % en ${own.name}` : ""} + ${g(addedUg)} g de ${added.name} = ${g(total)} g`;
  bottles.push({
    id,
    user_id: null,
    material_id: materialId,
    fraction: decimal(fraction),
    solvent: null,
    made_on: MADE_ON,
    description: `Pesado el ${MADE_ON} (${weighedText}), frasco de ${w.frasco}; bandeja del laboratorio del 18-nov, fila ${w.fila} de la tabla de diluciones.${w.nota ? ` ${w.nota}.` : ""}`.replace(/\.\./g, "."),
    label,
    material_mass_ug: materialUg.toString(),
    source_dilution_id: null,
    archived_at: null,
  });
  rows.forEach((r, position) =>
    diluents.push({ id: uuidFor(`frasco:${id}:${r.id}`), dilution_id: id, user_id: null, diluent_id: r.id, mass_ug: r.massUg.toString(), fraction: decimal(r.share), position }),
  );
  const target = Number(w.objetivo);
  const off = Number(decimal(fraction)) / target - 1;
  report.push(
    `| ${w.material} | ${w.frasco} | ${String(target * 100).replace(".", ",")} % | ${weighedText} | **${(Number(decimal(fraction)) * 100).toFixed(4).replace(".", ",")} %** | ${label} | ${rows.map((r) => `${r.name} ${(Number(decimal(r.share)) * 100).toFixed(2).replace(".", ",")} %`).join(" + ")} | ${Math.abs(off) > 0.02 ? `**${off > 0 ? "+" : ""}${(off * 100).toFixed(1).replace(".", ",")} %**` : ""} |`,
  );
}

writeTable(join(OUT, "lab_dilutions.csv"), ["id", "user_id", "material_id", "fraction", "solvent", "made_on", "description", "label", "material_mass_ug", "source_dilution_id", "archived_at"], bottles);
writeTable(join(OUT, "lab_dilution_diluents.csv"), ["id", "dilution_id", "user_id", "diluent_id", "mass_ug", "fraction", "position"], diluents);
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 59 · Tus ${bottles.length} frascos del 2026-11-17, en tu cuenta

*Generada por \`migracion-v3/tanda-59-frascos-17-nov.ts\` (2026-11-19). ${SAID}. Va a tu cuenta, no a lo común, y **se carga después de la tanda 58** (tres de los materiales son versiones suyas). Sin aprobar.*

Los pesos, de la tabla de la bandeja (\`migracion-v3/respuestas/frascos-2026-11-17.csv\`). La cifra exacta es la de lo pesado, a seis decimales; el nombre, el % redondo más cercano, como cuando das de alta un frasco en Diluciones. Fecha de todos: 2026-11-17.

| Material | Frasco | Objetivo | Lo pesado | Exacto | Nombre | Diluyentes | Desvío |
|---|---|---|---|---|---|---|---|
${report.join("\n")}

- **Comprobado:** cada % exacto coincide con el de la bandeja a cuatro decimales.
- **Manzanate y C12 láurico:** van al exacto (1,49 % y 2,24 %), como pide la bandeja, también en su nombre.
- **Lavanda, cilantro y litsea, del kit de Olfatorium:** el % exacto supone que el frasco del kit es puro. La ficha del kit dice de sus 30 materias «la mayoría ya diluidas y listas para usar» sin decir cuáles (tanda 8): si alguno venía diluido, el % real es menor. Mira la etiqueta.
- **Cumarina al 10 %:** no va aquí. El frasco vacío lo archivas tú desde Diluciones, con el botón nuevo de cada fila.
- **Pendientes, para otra tanda:** Aurantiol al 10 % (desde el 49,87 %), Vinyl Sulfurol al 0,5 %, Rose Crystals, osmanto e hyraceum.
`,
  "utf8",
);
console.log(`Tanda 59: ${bottles.length} frascos, ${diluents.length} diluyentes. ${OUT}/informe.md`);
