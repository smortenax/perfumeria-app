/**
 * Batches 52 and 53 (V3-102): a tincture carries its share of matter, estimated when its product does
 * not say it. The user, 2026-11-09: «Ambas tinturas tienen que tener un valor estimado que haga de
 * filler», and to the session's reading (the 20 % ceiling, option A for the ambergris): «Si adelante».
 *
 * Batch 52, common:
 * - The commercial tonka tincture: its own composition, what IFRA's annex gives the tonka bean absolute
 *   scaled by the tincture's share, as consensus: the share is not on its sheet, so the estimate counts
 *   its maximum, 20 % (Arctander, via Scentspiracy). With V3-102 it no longer borrows the absolute whole.
 *   Its impact, 7, was PerfuMate's tonka CO2 extract (matched by CAS): it becomes 4, by the rule of the
 *   Maese branch (pure − 3 · log10(1 / share), the share estimated at 10 %).
 * - Ambergris, pure: a new common material, so that your ambergris is the pure one and the 10 % stays in
 *   the bottle (option A; the user, 2026-10-31: «si en el futuro los tengo puros es poco practico»).
 *
 * Batch 53, your account: your ambergris («Ambergris, commercial tincture (purified)», Maese Lab) is
 * based on the pure ambergris and named so; its bottle, «de fábrica, al 10 %» (batch 42), does not change.
 *
 *   node migracion-v3/tanda-52-tinturas.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";
import { uuidFor } from "./lib/ids.ts";

const OUT = "migracion-v3/tandas/52-tinturas";
const OUT_ACCOUNT = "migracion-v3/tandas/53-tu-ambar-gris";
const SAID = "V3-102 (the user, 2026-11-09: «Ambas tinturas tienen que tener un valor estimado que haga de filler»; «Si adelante»)";
const SCENT = "https://www.scentspiracy.com/blog/tinctures-in-perfumery-definition-and-overview";
const SHARE_SOURCE = `Scentspiracy, ${SCENT}: «The ratio of raw material to alcohol is typically between 3% and 20% by weight» (Arctander, 1960, p. 11); «10-15% by weight: Standard ratio for strongly aromatic botanicals» (Sell, 2006, p. 146)`;
type Rec = Record<string, Cell>;

const TONKA_T = "bd30c4f7-e2fd-5091-9fad-bd8e9fd565b6";
const AMBER_T = "f651a9e1-1f05-579f-8a87-5c9b717fe203";
const MY_AMBER = "2d530f4c-8acd-549d-baa2-53e836c1e52d";
/** The estimate counts its maximum (V3-7): the top of the cited range. */
const CEILING = { text: "0.2", num: 2n, den: 10n };

const read = (file: string) => {
  const text = readFileSync(join("v3/datos", file), "utf8");
  return { header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] };
};
const materials = read("materials.csv");
const components = read("material_components.csv");
const annexRows = read("ifra_annex.csv").rows;

const tonka = materials.rows.find((m) => m.id === TONKA_T);
const amber = materials.rows.find((m) => m.id === AMBER_T);
if (!tonka || !amber) throw new Error("las tinturas de tonka y ámbar gris no están en lo común");
if (components.rows.some((c) => c.material_id === TONKA_T)) throw new Error("la tintura de tonka ya tiene composición: ¿se corrió la tanda dos veces?");

// What the annex gives the tonka bean absolute, scaled by the share, exactly (decimal text times 2/10).
const scaled = (value: string) => {
  const [int, frac = ""] = value.split(".");
  const digits = BigInt(int + frac) * CEILING.num;
  const places = frac.length + 1;
  const s = digits.toString().padStart(places + 1, "0");
  return `${s.slice(0, -places)}.${s.slice(-places)}`.replace(/0+$/, "").replace(/\.$/, "");
};
const absolute = annexRows.filter((a) => a.natural_name === "Tonka Bean absolute");
if (absolute.length === 0) throw new Error("el anexo no tiene «Tonka Bean absolute»");
const newComponents: Rec[] = absolute.map((a) => ({
  id: uuidFor(`comp:tanda52:${TONKA_T}:${a.constituent_cas}`),
  material_id: TONKA_T,
  owner_id: null,
  component_id: null,
  component_cas: a.constituent_cas,
  component_name: a.constituent_name,
  amount_kind: "max",
  value: null,
  min: null,
  max: scaled(String(a.concentration)),
  authority: "consensus",
  source: `Estimate (${SAID}): IFRA ${a.amendment}, naturals annex, «Tonka Bean absolute»: ${a.constituent_name} ${String(a.concentration)} (a fraction), times the tincture's share of matter, which its sheet does not give, taken at its ceiling, ${CEILING.text}: ${SHARE_SOURCE}. Not of this product.`,
}));

const IMPACT_SOURCE = `Estimate (${SAID}): the rule of the Maese branch (migracion-v3/web/maese-perfumeria/fuentes-tinturas.md), pure − 3 · log10(1 / share) = 7 − 3 = 4, with 7 PerfuMate's «Tonka Bean CO2 Extract» (https://perfumate.app/material/tonka-bean-co2-extract) and the share estimated at 10 % (${SHARE_SOURCE}). Before: 7, the CO2 extract's, matched by CAS (batch 43).`;
const PURE_ID = uuidFor("comun:tanda52:ambergris-puro");
const pure: Rec = {
  ...Object.fromEntries(materials.header.map((h) => [h, null])),
  id: PURE_ID,
  owner_id: null,
  name: "Ambergris",
  kind: "natural",
  solvent: false,
  aliases: ["Ambra grisea", "Ámbar gris"],
  other_cas: [],
  disputed_fields: [],
  species: amber.species,
  part: amber.part,
  category_id: amber.category_id,
  family: amber.family,
  family_detail: amber.family_detail,
  facets: amber.facets,
  tier: amber.tier,
  blend_effect: amber.blend_effect,
  handling: amber.handling,
  impact: 5,
  impact_source:
    "PerfuMate, https://perfumate.app/material/absolute-ambergris: «impact 5» (Absolute Ambergris, the nearest to the pure material PerfuMate has; its tincture, 4). Estimate: not of raw ambergris.",
  notes:
    "The pure material, as the user keeps it (V3-102, option A): a tincture of it is a bottle at its share, in ethanol. No CAS: the ones in use (84836-94-2, 8038-65-1) are given for its extract and its tincture, so none is put here.",
  sources: `${SAID}; species, part, family, facets, level, effect and handling from «Ambergris, commercial tincture (purified)» (${AMBER_T}), which are of the animal matter, not of the tincture`,
  confidence: "low",
};
const newMaterials = materials.rows.map((m) => (m.id === TONKA_T ? { ...m, impact: 4, impact_source: IMPACT_SOURCE } : m));
newMaterials.push(pure);
writeTable(join(OUT, "materials.csv"), materials.header, newMaterials);
writeTable(join(OUT, "material_components.csv"), components.header, [...components.rows, ...newComponents]);

const pct = (fraction: string) => `${(Number(fraction) * 100).toLocaleString("es-ES", { maximumFractionDigits: 3 })} %`;
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 52 · Las tinturas, con su parte de materia estimada (V3-102)

*Generada por \`migracion-v3/tanda-52-tinturas.ts\` sobre \`v3/datos/\`. Común: se aprueba con \`aprobar.ts 52-tinturas\` y entra en la nube al fusionar en \`main\`. Va con el cambio de código de V3-102: una tintura ya no toma del anexo de IFRA lo de otra forma de su planta.*

${SAID}.

## La tintura comercial de tonka (\`${TONKA_T}\`)

**IFRA.** Antes tomaba lo del absoluto entero. Ahora lleva su propia composición: lo del anexo para el absoluto, por su parte de materia. Su ficha no da esa parte, así que se toma el techo del rango citado, el 20 %. Es consenso: nunca da «dentro», como mucho «acotado».

| Constituyente | El absoluto (anexo de IFRA) | La tintura (estimación, hasta) |
|---|---|---|
${absolute.map((a) => `| ${a.constituent_name} (${a.constituent_cas}) | ${pct(String(a.concentration))} | ${pct(scaled(String(a.concentration)))} |`).join("\n")}

Fuente de la parte de materia: ${SHARE_SOURCE}.

**Fuerza.** Pasa de 7 a 4. El 7 era el del extracto CO2 de tonka de PerfuMate, que casó por CAS en la tanda 43. El 4 sale de la regla de la rama de Maese: 7 − 3 · log10(1 / 0,1), con la parte estimada al 10 %. Es una estimación.

## El ámbar gris puro, nuevo en lo común (\`${PURE_ID}\`)

Es el material puro, para que tu ámbar gris sea el puro y el 10 % quede solo en el frasco (opción A). Toma de la tintura común lo que es de la materia animal: la especie, la parte, la familia, las facetas, el nivel, el efecto y el manejo. No toma lo que es de la tintura: la forma, el proceso, las dosis, las horas ni la fuerza.

- **Fuerza 5:** la de «Absolute Ambergris» de PerfuMate, lo más cercano al puro que tiene (su tintura tiene 4). Es una estimación.
- **Sin CAS:** los que circulan (84836-94-2 y 8038-65-1) se dan para su extracto y su tintura.
- La tintura común sigue igual, para quien la registre como material propio.

## Qué no cambia

- Las demás tinturas comunes (ambreta y los dos cardamomos): ninguna toma nada del anexo de IFRA, porque no tiene entrada con su CAS. Con el cambio de código siguen igual, pendientes y sin composición.
- Las 117 tinturas de la tanda 50 (rama de Maese, sin aprobar) siguen la misma regla cuando se rehagan sobre esto.
`,
  "utf8",
);

// Batch 53, your account: only cells that still say what is expected change (cargar-laboratorio.ts).
writeTable(join(OUT_ACCOUNT, "cambiar.csv"), ["table", "id", "column", "before", "after"], [
  { table: "materials", id: MY_AMBER, column: "based_on_id", before: AMBER_T, after: PURE_ID },
  { table: "materials", id: MY_AMBER, column: "name", before: "Ambergris, commercial tincture (purified)", after: "Ambergris" },
] as Rec[]);
writeFileSync(
  join(OUT_ACCOUNT, "informe.md"),
  `# Tanda 53 · Tu ámbar gris es el puro (V3-102, opción A)

*Generada por \`migracion-v3/tanda-52-tinturas.ts\`. De tu cuenta: se aprueba con \`aprobar.ts --cuenta 53-tu-ambar-gris\` y se carga desde el PC con \`cargar-laboratorio.ts <correo> --nube --tanda=53-tu-ambar-gris\`, **después de que la tanda 52 esté en la nube** (al fusionar en \`main\`).*

${SAID}. El usuario, 2026-10-31, sobre los frascos de fábrica: «si en el futuro los tengo puros es poco practico».

| Tu material (\`${MY_AMBER}\`) | Antes | Después |
|---|---|---|
| Basado en | la tintura común (\`${AMBER_T}\`) | el ámbar gris puro (\`${PURE_ID}\`) |
| Nombre | Ambergris, commercial tincture (purified) | Ambergris |

**Lo que no cambia:**
- Tu frasco de la tanda 42, «de fábrica, al 10 % en etanol», con su origen: Maese Lab, «Ambar Gris - Tintura al 10%». Ahora lo dice bien: un 10 % de ámbar gris, y no un 10 % de una tintura que ya va al 10 %.
- Tu producto, «Tintura de ámbar gris purificada», tu proveedor, Maese Lab, y tus notas.

Solo cambia una celda si todavía dice lo de «Antes». Si ya la cambiaste en la app, se queda como esté.
`,
  "utf8",
);
console.log(`Tanda 52: tonka (${newComponents.length} constituyentes estimados, fuerza 7 → 4) y ámbar gris puro (${PURE_ID}). Tanda 53: 2 celdas de tu ámbar gris. ${OUT}/informe.md`);
