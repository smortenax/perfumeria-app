/**
 * Batch 22 (V3-76): ten families, Gourmand the tenth. The user, 2026-10-24: «Families: Ten families
 * (Gourmand)», option A of the redesign's mock-up. Made from the common data as v3/datos/ has it at
 * BASE, so that redoing it gives the same tables:
 *
 * - the palette (V3-38) gains Gourmand, last, with the mock-up's colour, and what goes into Fruity,
 *   Spicy and Animal changes as option A says: Fruity gives up «gourmand», Spicy gives up balsamic
 *   and amber, and amber goes to Animal;
 * - the common materials of Fruity and Spicy whose own words (family_detail) name what those two
 *   give up move by the rules below, first match. Your version of each inherits its new family.
 *   The common materials of other families whose words say gourmand or coumarinic are only listed:
 *   nothing in V3-76 moves them, so they are the user's call.
 *
 *   node migracion-v3/tanda-22-diez-familias.ts
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords } from "../src/data/csv.ts";
import { type Cell, writeTable } from "./lib/csv.ts";

const BASE = "0e81550";
const OUT = "migracion-v3/tandas/22-diez-familias";
const DECISION = "V3-76 (el usuario, 2026-10-24: «Families: Ten families (Gourmand)»)";
type Rec = Record<string, Cell>;
const read = (path: string) => {
  const text = execSync(`git show ${BASE}:${path}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { header: text.slice(0, text.indexOf("\n")).split(","), rows: parseCsvRecords(text) as Rec[] };
};
const palette = read("v3/datos/family_palette.csv");
const materials = read("v3/datos/materials.csv");

// What goes into each family, before and after (option A of the mock-up). The old text is checked,
// so a palette changed since BASE stops the batch instead of being overwritten.
const COVERS: Record<string, { readonly was: string; readonly now: string }> = {
  fruity: { was: "frutal, gourmand", now: "frutal" },
  spicy: { was: "especiado, anisado, balsámico, ámbar", now: "especiado, anisado" },
  animal: { was: "animal, almizcle, cuero", now: "animal, almizcle, cuero, ámbar" },
};
if (palette.rows.some((r) => r.family === "gourmand")) throw new Error("La paleta ya tiene Gourmand");
const newPalette: Rec[] = palette.rows.map((r) => {
  const change = COVERS[String(r.family)];
  if (!change) return r;
  if (r.covers !== change.was) throw new Error(`${r.family}: «${r.covers}», y se esperaba «${change.was}»`);
  return { ...r, covers: change.now, source: `${r.source}; qué entra, cambiado por ${DECISION}` };
});
newPalette.push({
  family: "gourmand",
  order: palette.rows.length + 1,
  name: "Gourmand",
  short: "Gourmand",
  colour_name: "caramelo",
  light: "#d4a373",
  dark: "#b8875a",
  covers: "vainilla, caramelo, balsámico, cremoso, azucarado",
  source: `${DECISION}; el color, de la maqueta del rediseño (designVault, 00-inbox/research/kit/revamp-prototype.html, opción A)`,
});

// Where a material of Fruity or Spicy goes, by its own words: what its family gives up under V3-76.
const RULES: ReadonlyArray<{ readonly from: readonly string[]; readonly match: RegExp; readonly to: string; readonly why: string }> = [
  { from: ["fruity", "spicy"], match: /tostad/, to: "transformed", why: "tostado: lo cubre Transformado (tostados, pirazinas)" },
  { from: ["spicy"], match: /ámbar/, to: "animal", why: "ámbar: Especiado lo deja y pasa a Animal" },
  { from: ["spicy"], match: /incienso/, to: "woody", why: "incienso: Especiado deja lo resinoso; la maqueta lleva el incienso a Amaderado" },
  { from: ["spicy"], match: /balsámic/, to: "gourmand", why: "balsámico: Especiado lo deja y pasa a Gourmand" },
  { from: ["fruity"], match: /gourmand|lácteo|vainill|caramel/, to: "gourmand", why: "gourmand o cremoso: Frutal lo deja y pasa a Gourmand" },
];
const moves: { readonly name: string; readonly from: string; readonly to: string; readonly detail: string; readonly why: string }[] = [];
const newMaterials = materials.rows.map((r) => {
  const detail = String(r.family_detail ?? "");
  const rule = RULES.find((x) => x.from.includes(String(r.family)) && x.match.test(detail));
  if (!rule) return r;
  moves.push({ name: String(r.name), from: String(r.family), to: rule.to, detail, why: rule.why });
  return { ...r, family: rule.to };
});
const asks = materials.rows.filter((r) => !["fruity", "spicy"].includes(String(r.family)) && /gourmand|cumarín/.test(String(r.family_detail ?? "")));

const asCells = (rows: Rec[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && /^\[.*\]$/.test(v) ? (JSON.parse(v) as string[]) : v])));
writeTable(join(OUT, "family_palette.csv"), palette.header, newPalette);
writeTable(join(OUT, "materials.csv"), materials.header, asCells(newMaterials));

const NAMES: Record<string, string> = Object.fromEntries(newPalette.map((r) => [String(r.family), String(r.name)]));
const cell = (t: string) => t.replace(/\|/g, "/");
const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name, "es");
writeFileSync(
  join(OUT, "informe.md"),
  `# Tanda 22 · Diez familias: Gourmand, la décima

*Generada por \`migracion-v3/tanda-22-diez-familias.ts\` sobre lo común como está en \`v3/datos/\` (commit \`${BASE}\`). La decisión es ${DECISION}. Escribe \`v3/datos/family_palette.csv\` y \`v3/datos/materials.csv\`.*

## La paleta

| Familia | Clave | Color | Claro | Oscuro | Qué entra |
|---|---|---|---|---|---|
${newPalette.map((o) => `| ${o.name} | ${o.family} | ${o.colour_name} | \`${o.light}\` | \`${o.dark}\` | ${COVERS[String(o.family)] ? `**${o.covers}** (antes: ${COVERS[String(o.family)].was})` : o.family === "gourmand" ? `**${o.covers}** (nueva)` : o.covers} |`).join("\n")}

El color de Gourmand es el de la maqueta (\`#d4a373\` en claro, \`#b8875a\` en oscuro); el nombre «caramelo», propuesta de la sesión.

## Los materiales que cambian de familia (${moves.length})

Solo los comunes de Frutal y Especiado cuyo matiz (\`family_detail\`, tus palabras) nombra lo que esas dos familias dejan. Tu versión de cada uno hereda la familia nueva.

| Material | Tu matiz | Ahora | Pasa a | Por qué |
|---|---|---|---|---|
${[...moves].sort(byName).map((m) => `| ${m.name} | ${cell(m.detail)} | ${NAMES[m.from]} | **${NAMES[m.to]}** | ${m.why} |`).join("\n")}

## Para que decidas tú (no cambian)

Son de otras familias y su matiz dice gourmand o cumarínico; V3-76 no los mueve.

| Material | Tu matiz | Familia |
|---|---|---|
${asks.map((r) => ({ name: String(r.name), detail: String(r.family_detail), family: String(r.family) })).sort(byName).map((r) => `| ${r.name} | ${cell(r.detail)} | ${NAMES[r.family]} |`).join("\n")}
`,
  "utf8",
);
console.log(`Tanda 22: ${newPalette.length} familias; ${moves.length} materiales cambian de familia; ${asks.length} para que decidas. ${OUT}/informe.md`);
