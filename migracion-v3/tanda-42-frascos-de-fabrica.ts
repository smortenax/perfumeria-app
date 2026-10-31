/**
 * Batch 42 (2026-10-31): into YOUR ACCOUNT, never into the common data. Five bottles that came
 * already diluted, registered as bottles «de fábrica, al 10 %», without weights, as batch 25 did with
 * the factory bottles of Harrison Joseph. The user, 2026-10-31: «si cargame las diluciones de los que
 * ya venian diluidos dalos como el % y fabrica pero no cambies el material a solo ser posible en 10%
 * si en el futuro los tengo puros es poco practico».
 *
 * So the material stays what it is (the pure one, your version, unchanged): the 10 % lives only in
 * the bottle. Every material is already yours (batches 8 and 24). Where each 10 % comes from:
 * - vetiver and patchouli of the Olfatorium kit: the user, 2026-10-31, «si vetiver y patchouli ya
 *   venian al 10% en dpg»;
 * - tobacco absolute: your product, «Absoluto de tabaco 10 % DPG, Olfatorium»;
 * - cocoa absolute: your product, «absoluto de cacao de Ghana al 10 % en alcohol, Maese Lab»;
 * - ambergris tincture: «Maese Lab ya lo entrega al 10 % en bioetanol de 96º» (your version's
 *   recommended dilution, from Maese Lab's sheet «Ambar Gris - Tintura al 10%»).
 * Approved with `aprobar.ts --cuenta`, loaded with
 * `cargar-laboratorio.ts <your email> --nube --tanda=42-frascos-de-fabrica`.
 *
 *   node migracion-v3/tanda-42-frascos-de-fabrica.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const OUT = "migracion-v3/tandas/42-frascos-de-fabrica";
const SAID =
  "el usuario, 2026-10-31: «si cargame las diluciones de los que ya venian diluidos dalos como el % y fabrica pero no cambies el material a solo ser posible en 10% si en el futuro los tengo puros es poco practico»";
const REGISTERED_ON = "2026-10-31";
type Rec = Record<string, Cell>;

// The common diluents, as batches 24, 25 and 34 use them.
const ETHANOL = { id: "8c6d2ffa-b0e9-562e-815c-a77973deb67e", name: "Etanol" };
const DPG = { id: "2027b1c9-0d48-5111-b189-2011b3fef123", name: "DPG" };

const FACTORY = [
  { key: "vetiver", name: "Vetiver Haití (Olfatorium)", material: "eddcce30-c42e-5dac-b5fe-381f00f75951", diluent: DPG, why: "el usuario, 2026-10-31: «si vetiver y patchouli ya venian al 10% en dpg»" },
  { key: "patchouli", name: "Patchouli (Olfatorium)", material: "f2e3ed79-9193-53cc-9f6c-eadb8a4bcc1d", diluent: DPG, why: "el usuario, 2026-10-31: «si vetiver y patchouli ya venian al 10% en dpg»" },
  { key: "tabaco", name: "Absoluto de tabaco (Olfatorium)", material: "80381a8d-6a19-532d-b999-af7dbb48e1a3", diluent: DPG, why: "tu producto: «Absoluto de tabaco 10 % DPG, Olfatorium»" },
  { key: "cacao", name: "Absoluto de cacao (Maese Lab)", material: "c3f5fd86-539a-562c-848a-bf5b872301dc", diluent: ETHANOL, why: "tu producto: «absoluto de cacao de Ghana al 10 % en alcohol, Maese Lab»" },
  { key: "ambar-gris", name: "Tintura de ámbar gris (Maese Lab)", material: "2d530f4c-8acd-549d-baa2-53e836c1e52d", diluent: ETHANOL, why: "Maese Lab: «Ambar Gris - Tintura al 10%», en bioetanol de 96º" },
] as const;

const bottles: Rec[] = [];
const diluents: Rec[] = [];
for (const f of FACTORY) {
  const id = uuidFor(`frasco:tanda42:${f.key}`);
  bottles.push({
    id,
    user_id: null,
    material_id: f.material,
    fraction: "0.1",
    solvent: null,
    made_on: REGISTERED_ON,
    description: `De fábrica, al 10 % en ${f.diluent.name}; registrado el ${REGISTERED_ON}, sin pesar. De dónde sale el 10 %: ${f.why}.`,
    label: "de fábrica, al 10 %",
    material_mass_ug: null,
    source_dilution_id: null,
    archived_at: null,
  });
  diluents.push({ id: uuidFor(`frasco:${id}:${f.diluent.id}`), dilution_id: id, user_id: null, diluent_id: f.diluent.id, mass_ug: null, fraction: "0.9", position: 0 });
}

writeTable(join(OUT, "lab_dilutions.csv"), ["id", "user_id", "material_id", "fraction", "solvent", "made_on", "description", "label", "material_mass_ug", "source_dilution_id", "archived_at"], bottles);
writeTable(join(OUT, "lab_dilution_diluents.csv"), ["id", "dilution_id", "user_id", "diluent_id", "mass_ug", "fraction", "position"], diluents);
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 42 · Cinco frascos de fábrica, al 10 %, en tu cuenta

*Generada por \`migracion-v3/tanda-42-frascos-de-fabrica.ts\` (${REGISTERED_ON}). ${SAID}.*

Cada uno, un frasco «de fábrica, al 10 %», sin pesos, como los de Harrison Joseph (tanda 25). El material sigue siendo el puro: tu versión no cambia; el 10 % está solo en el frasco.

| Frasco | Al | Diluyente | De dónde sale el 10 % |
|---|---|---|---|
${FACTORY.map((f) => `| ${f.name} | 10 % | ${f.diluent.name} | ${f.why} |`).join("\n")}
`,
  "utf8",
);
console.log(`Tanda 42: ${bottles.length} frascos de fábrica, ${diluents.length} diluyentes. ${OUT}/informe.md`);
