/**
 * The improvements sheet of the materials glossary (V3-46): what each common material still lacks in
 * its record, so that it can be put in order later. It reads only what was approved (v3/datos/) and
 * writes docs-v3/mejoras-glosario-materiales.md. It changes no datum: run it again when you come
 * back to the sheet, and it says what is still missing.
 *
 *   node migracion-v3/mejoras-glosario.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { parseCsvRecords } from "../src/data/csv.ts";

const OUT = "docs-v3/mejoras-glosario-materiales.md";
type Rec = Readonly<Record<string, string>>;
const table = (name: string): Rec[] => parseCsvRecords(readFileSync(`v3/datos/${name}.csv`, "utf8"));
const materials = table("materials").filter((m) => m.owner_id === "");
const withRows = (name: string) => new Set(table(name).map((r) => r.material_id));
const descriptors = withRows("material_descriptors");
const doses = withRows("material_doses");
const audit = parseCsvRecords(readFileSync("migracion-v3/auditoria.csv", "utf8"));
const commit = execSync("git log -1 --format=%h -- v3/datos", { encoding: "utf8" }).trim();

const KIND: Readonly<Record<string, string>> = { molecule: "molécula", natural: "natural", composition: "base" };
/** What the general record of a material should say; a check is null when it does not apply to that material. */
const CHECKS: ReadonlyArray<readonly [string, (m: Rec) => boolean | null]> = [
  ["CAS", (m) => (m.kind === "molecule" ? m.cas !== "" : null)],
  ["especie", (m) => (m.kind === "natural" ? m.species !== "" : null)],
  ["abreviatura", (m) => m.abbreviation !== ""],
  ["familia", (m) => (m.solvent === "true" ? null : m.family !== "")],
  ["nivel", (m) => (m.solvent === "true" ? null : m.tier !== "")],
  ["tenacidad", (m) => (m.solvent === "true" ? null : m.tenacity_hours !== "")],
  ["intensidad", (m) => (m.solvent === "true" ? null : m.strength !== "")],
  ["evolución", (m) => (m.solvent === "true" ? null : [m.evolution_to_15m, m.evolution_to_2h, m.evolution_to_8h, m.evolution_to_24h, m.evolution_beyond_24h].some((e) => e !== ""))],
  ["descriptores", (m) => (m.solvent === "true" ? null : descriptors.has(m.id))],
  ["dosis", (m) => (m.solvent === "true" ? null : doses.has(m.id))],
  ["estado físico", (m) => m.physical_state !== ""],
];
const missing = (m: Rec) => CHECKS.filter(([, check]) => check(m) === false).map(([name]) => name);
const applies = (name: string) => materials.filter((m) => CHECKS.find(([n]) => n === name)![1](m) !== null);

const byName = (a: Rec, b: Rec) => a.name.localeCompare(b.name, "es");
const sorted = [...materials].sort(byName);
const emptiest = sorted.map((m) => ({ m, lack: missing(m) })).filter((x) => x.lack.length >= 4).sort((a, b) => b.lack.length - a.lack.length || byName(a.m, b.m));
const noFamily = sorted.filter((m) => m.solvent !== "true" && m.family === "");
const noAbbreviation = sorted.filter((m) => m.abbreviation === "");
const cell = (t: string) => t.replace(/\|/g, "\\|");
const mark = (v: boolean | null) => (v === null ? "·" : v ? "sí" : "**—**");

const report = `# Mejoras del glosario de materiales

*Generada por \`migracion-v3/mejoras-glosario.ts\` desde lo común aprobado (\`v3/datos/\`, commit \`${commit}\`). No se edita a mano: cuando vuelvas a ella, se ejecuta otra vez y dice lo que sigue faltando. No cambia ningún dato.*

**Por qué existe (V3-46).** Las tandas 7 y 9 entraron con huecos, aceptados de momento: «si de momento acepto para materiales vacios como seuderal y otros sin registro de familia se documenta en una ficha de mejoras de app:glosario materiales que se revisitara para ir teniendo los materiales al orden necesario» (orko kill, 2026-10-14). Esta es esa ficha. Cada hueco se llena con su fuente, por una tanda que apruebas, nunca a mano.

## Resumen

${materials.length} materiales comunes. Lo que le falta a cada campo del registro general, contando solo donde aplica: el CAS, en las moléculas; la especie, en los naturales; y del olor y el uso, nada en los ${materials.filter((m) => m.solvent === "true").length} disolventes.

| Campo | Le falta a | De |
|---|---|---|
${CHECKS.map(([name]) => `| ${name} | ${applies(name).filter((m) => missing(m).includes(name)).length} | ${applies(name).length} |`).join("\n")}

${applies("evolución").every((m) => missing(m).includes("evolución")) ? "**La evolución** está vacía en todos: el laboratorio no la da por tramos, y repartirla en los cinco de V3-42 queda por hacer." : ""}

## Los más vacíos (les faltan 4 campos o más)

| Material | Tipo | Le falta |
|---|---|---|
${emptiest.map(({ m, lack }) => `| ${cell(m.name)} | ${KIND[m.kind] ?? m.kind} | ${lack.join(", ")} |`).join("\n")}

## Sin familia (${noFamily.length})

Sin familia, la app no le da color (V3-38). La familia sale de la pareja en la v1 (tanda 7): un material sin pareja en la v2, o cuya fila de la v1 no la tiene, queda sin ella.

${noFamily.map((m) => `- ${m.name} (${KIND[m.kind] ?? m.kind})`).join("\n")}

## Abreviaturas

- **Sin abreviatura (${noAbbreviation.length}):** ${noAbbreviation.map((m) => m.name).join(" · ")}.
- **Generadas, provisionales:** ${materials.filter((m) => m.abbreviation_origin === "generated").length}. **Tuyas, del glosario de la v1:** ${materials.filter((m) => m.abbreviation_origin === "user").length}.
- **A revisar (V3-45):** muchas salen del nombre químico en vez del comercial, y eso confunde. La lista entera, con la columna «abreviatura» de la tabla de abajo. Los otros códigos de la v1 de cada pareja no entraron (V3-45).

## A auditar (V3-51)

Lo que se sabe mal o dudoso, para corregirlo como detalle: mala información es peor que falta de información. La lista es \`migracion-v3/auditoria.csv\`; se añade una fila por hallazgo.

| Id | Material | Campo | Problema | Pista |
|---|---|---|---|---|
${audit.map((r) => `| ${r.id} | ${cell(r.material)} | ${r.campo} | ${cell(r.problema)} | ${cell(r.pista)} |`).join("\n")}

## Material por material

«sí»: lo tiene; «—»: le falta; «·»: no aplica.

| Material | Tipo | Abreviatura | ${CHECKS.filter(([n]) => n !== "abreviatura").map(([n]) => n).join(" | ")} |
|---|---|---|${CHECKS.filter(([n]) => n !== "abreviatura").map(() => "---").join("|")}|
${sorted
  .map((m) => `| ${cell(m.name)} | ${KIND[m.kind] ?? m.kind}${m.solvent === "true" ? ", disolvente" : ""} | ${m.abbreviation ? `${cell(m.abbreviation)}${m.abbreviation_origin === "generated" ? " (generada)" : ""}` : "**—**"} | ${CHECKS.filter(([n]) => n !== "abreviatura").map(([, check]) => mark(check(m))).join(" | ")} |`)
  .join("\n")}
`;
writeFileSync(OUT, report, "utf8");
console.log(`${OUT}: ${materials.length} materiales; ${emptiest.length} con 4 huecos o más, ${noFamily.length} sin familia, ${noAbbreviation.length} sin abreviatura.`);
