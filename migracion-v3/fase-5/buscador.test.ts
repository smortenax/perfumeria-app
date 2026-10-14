import { execSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import type { CatalogMaterial } from "../../v3/src/db/catalog";
import { indexCatalog, normalize, search, type SearchIndex, type SearchRow } from "../../v3/src/db/search";
import { many, readSources, type Row } from "../lib/fuentes.ts";
import { loadPairs, loadV3, ROOT } from "./cargar";

/**
 * Phase 5, steps 5.2 and 5.3 (plan v3; V3-6, V3-11, V3-13, V3-24, V3-34): the v3's search over your 111
 * materials and their versions, as the CSV files have them.
 *
 * - 5.2: each of your materials is found by every name it had in the v1 (the rows of its pair's v1 glossary,
 *   `datos/v2/v1-a-v2.csv`) and in the lab (`materiales.sqlite`: its name, its synonyms and your bottle). The
 *   names are read from those files, not from the v3, so a name the migration lost shows.
 * - 5.3: the search does not repeat: one row per category, with its materials under it; no name twice in a
 *   list without something that tells them apart; and no table but `materials` points to a category.
 *
 * It writes `buscador.md` next to this file. A name that does not find its material is listed, never fixed here.
 *
 *   npx vitest run --config migracion-v3/fase-5/vitest.config.ts
 */
const FOLDER = import.meta.dirname;
const LAB = join(ROOT, "../Perfumery/biblioteca/materiales.sqlite");
/** The rows a box shows before one scrolls: what «it finds it» means. */
const SHOWN = 12;

interface Name {
  readonly text: string;
  /** Where the name comes from: «laboratorio: sinónimo», «v1 fig:12: código»… */
  readonly from: string;
}

/** Every name a v1 row was found by in the v1's search (src/data/catalog.ts, `search`). */
function v1Names(id: string, r: Row): Name[] {
  const at = (field: string, texts: readonly string[]) => texts.filter((t) => t.trim() !== "").map((text) => ({ text: text.trim(), from: `v1 ${id}: ${field}` }));
  return [
    ...at("código", [r.codigo]),
    ...at("sigla", [r.sigla_comercial, r.icono_distintivo && r.sigla_comercial ? `${r.icono_distintivo}${r.sigla_comercial}` : ""]),
    ...at("nombre comercial", [r.nombre_comercial, ...many(r.otros_nombres_comerciales)]),
    ...at("nombre", [r.nombre]),
    ...at("CAS", [r.cas, ...many(r.otros_cas)]),
    ...at("nombre de IFRA", many(r.nombre_ifra)),
    ...at("sinónimo", [...many(r.sinonimos), ...many(r.nombres_transparencia), ...many(r.sinonimos_pubchem)]),
    ...at("nombre de tienda", many(r.nombres_proveedores)),
  ];
}

interface Lookup {
  readonly name: Name;
  /** 1 for the first row; null when no row has the material. */
  readonly rank: number | null;
}

/** Where the row with this material comes, among all the rows the name finds. */
function rankOf(index: SearchIndex, text: string, id: string): number | null {
  const at = (limit: number) => search(index, text, limit).findIndex((r) => r.members.some((m) => m.matched && m.material.id === id));
  const shown = at(SHOWN);
  const rank = shown >= 0 ? shown : at(Number.POSITIVE_INFINITY);
  return rank < 0 ? null : rank + 1;
}

/** What tells two materials of one row apart: common or yours, form, shop, bottle, grade, house. */
const tell = (m: CatalogMaterial) => [m.ownerId === null ? "común" : "tuyo", m.form, m.supplier, m.product, m.grade, m.house].map((x) => x ?? "").join("·");

/** The rows of a list that show one name twice with nothing to tell them apart; and names that head two rows. */
function repeats(rows: readonly SearchRow[]): string[] {
  const out: string[] = [];
  const heads = new Map<string, number>();
  for (const row of rows) {
    heads.set(normalize(row.name), (heads.get(normalize(row.name)) ?? 0) + 1);
    const byName = new Map<string, CatalogMaterial[]>();
    for (const { material } of row.members) byName.set(normalize(material.name), [...(byName.get(normalize(material.name)) ?? []), material]);
    for (const [name, list] of byName) if (new Set(list.map(tell)).size < list.length) out.push(`«${name}» dos veces en la fila «${row.name}» sin nada que lo distinga`);
  }
  for (const [name, n] of heads) if (n > 1) out.push(`«${name}» encabeza ${n} filas`);
  return out;
}

describe("the v3's search over your materials", () => {
  it("finds each by its names of the v1 and the lab (5.2), and does not repeat (5.3)", async () => {
    const v3 = await loadV3();
    const sources = readSources(ROOT);
    const pairs = loadPairs(sources.v2, v3.catalog);
    const index = indexCatalog(v3.catalog);
    const products = new Map(sources.v2.products.map((p) => [p.id, p]));

    const lab = new DatabaseSync(LAB, { readOnly: true });
    const labNames = (labId: string): Name[] => {
      const name = lab.prepare("select name from materials where id = ?").get(labId) as { name: string };
      const synonyms = lab.prepare("select name from material_synonyms where material_id = ? order by name").all(labId) as Array<{ name: string }>;
      const bottles = lab.prepare("select product from user_materials where material_id = ? and product is not null order by product").all(labId) as Array<{ product: string }>;
      return [
        { text: name.name, from: "laboratorio: nombre" },
        ...synonyms.map((s) => ({ text: s.name, from: "laboratorio: sinónimo" })),
        // The lab writes a link to its research after the bottle's name («…, Olfatorium — [investigación…](…)»): not a name (as batch 8 reads it).
        ...bottles.map((b) => ({ text: b.product.replace(/\s*—\s*\[.*$/, ""), from: "laboratorio: tu frasco" })),
      ].filter((n) => n.text.trim() !== "");
    };
    const labCommit = execSync("git -C ../Perfumery log -1 --format=%h -- biblioteca/materiales.sqlite", { cwd: ROOT, encoding: "utf8" }).trim();

    interface Result {
      readonly labId: string;
      readonly name: string;
      readonly lookups: readonly Lookup[];
      readonly rowMembers: readonly string[];
    }
    const results: Result[] = [];
    const listRepeats = new Map<string, string[]>();
    for (const pair of pairs) {
      const v1 = pair.v2Material
        ? sources.v2.v1Links
            .filter((l) => l.v2Id === pair.v2Material || (pair.v2Id !== null && products.has(pair.v2Id) && l.productId === pair.v2Id))
            .map((l) => l.v1Id)
            .filter((id, i, all) => all.indexOf(id) === i && sources.v1.has(id))
        : [];
      const names = [...labNames(pair.labId), ...v1.flatMap((id) => v1Names(id, sources.v1.get(id)!))];
      // One name once: the first place it comes from.
      const seen = new Set<string>();
      const unique = names.filter((n) => !seen.has(n.text) && seen.add(n.text) !== undefined);
      const lookups = unique.map((name) => ({ name, rank: rankOf(index, name.text, pair.mineId) }));
      const rows = search(index, pair.name);
      for (const r of repeats(rows)) listRepeats.set(r, [...(listRepeats.get(r) ?? []), pair.name]);
      const own = rows.find((r) => r.members.some((m) => m.material.id === pair.mineId));
      results.push({ labId: pair.labId, name: pair.name, lookups, rowMembers: own ? own.members.map((m) => m.material.id) : [] });
    }
    lab.close();

    // 5.3: your version and its common material, in one row; a row per category.
    for (const r of results) expect(r.rowMembers, r.labId).toEqual(expect.arrayContaining([pairs.find((p) => p.labId === r.labId)!.commonId, pairs.find((p) => p.labId === r.labId)!.mineId]));
    const probes = ["lemon", "limón", "lavender", "lavanda", "cedar", "cedro", "bergamot", "rose", "musk", "amber"];
    const probeRows = probes.map((q) => ({ q, rows: search(index, q) }));
    for (const { q, rows } of probeRows) for (const r of repeats(rows)) listRepeats.set(r, [...(listRepeats.get(r) ?? []), q]);
    // Only materials point to a category: no other table of the schema keeps one.
    const migrations = readdirSync(join(ROOT, "v3/supabase/migrations")).filter((f) => f.endsWith(".sql"));
    const pointing = migrations.flatMap((f) =>
      readFileSync(join(ROOT, "v3/supabase/migrations", f), "utf8")
        .split("\n")
        .filter((l) => l.includes('REFERENCES "public"."material_categories"'))
        .map((l) => /ALTER TABLE "([^"]+)" ADD CONSTRAINT "[^"]+" FOREIGN KEY \("([^"]+)"\)/.exec(l)?.slice(1, 3).join(".") ?? l),
    );
    expect(pointing).toEqual(["materials.category_id"]);

    // ---------------------------------------------------------------- the report
    const all = results.flatMap((r) => r.lookups.map((l) => ({ ...l, r })));
    // Why a name does not find its material, when a decision says so; otherwise «sin explicar».
    const casAnswers = new Map(
      readFileSync(join(ROOT, "migracion-v3/respuestas/cas-de-la-v1.csv"), "utf8")
        .split("\n")
        .slice(1)
        .map((l) => l.split(","))
        .map(([id, cas, answer]) => [`${id} ${cas}`, answer] as const),
    );
    const reasonOf = (l: (typeof all)[number]): string | null => {
      const common = v3.catalog.materials.get(pairs.find((p) => p.labId === l.r.labId)!.commonId)!;
      if (l.name.from.endsWith(": código") && l.name.text !== common.abbreviation) return `V3-45: su abreviatura es ${common.abbreviation ?? "ninguna"}; los otros códigos de la v1 no entran`;
      if (l.name.from.endsWith(": CAS") && casAnswers.get(`${l.r.labId} ${l.name.text}`) === "fuera") return "V3-45: respondiste «fuera» en respuestas/cas-de-la-v1.csv";
      return null;
    };
    const lost = all.filter((l) => l.rank === null);
    const unexplained = lost.filter((l) => reasonOf(l) === null);
    const far = all.filter((l) => l.rank !== null && l.rank > SHOWN);
    const bySource = new Map<string, { n: number; lost: number; far: number }>();
    for (const l of all) {
      const key = l.name.from.replace(/^v1 \S+: /, "v1: ");
      const at = bySource.get(key) ?? { n: 0, lost: 0, far: 0 };
      bySource.set(key, { n: at.n + 1, lost: at.lost + (l.rank === null ? 1 : 0), far: at.far + (l.rank !== null && l.rank > SHOWN ? 1 : 0) });
    }
    const cell = (t: string) => t.replace(/\|/g, "\\|").replace(/\s+/g, " ");
    const report = `# Fase 5.2 y 5.3 · El buscador de la v3 con tus materiales

*Generado por \`migracion-v3/fase-5/buscador.test.ts\` con el buscador de la app (\`v3/src/db/search.ts\`) sobre lo común (\`v3/datos/\`) y tus versiones (\`migracion-v3/tandas/8-tu-version/\`). Los nombres salen de la v1 (\`datos/glosario/materiales.csv\`, por la pareja de \`respuestas/laboratorio.csv\` y \`datos/v2/v1-a-v2.csv\`; commit \`${sources.commit}\`) y del laboratorio (\`materiales.sqlite\`, commit \`${labCommit}\`, abierto solo para leer), no de la v3: un nombre que la migración perdiera saldría aquí.*

## 5.2 · Cada material tuyo, por sus nombres de la v1 y del laboratorio

- **${results.length} materiales, ${all.length} nombres** (cada nombre una vez por material). **${all.length - lost.length} lo encuentran** (tu versión, en una fila de la lista) y **${lost.length} no**: ${lost.length - unexplained.length} por una decisión y **${unexplained.length} sin explicar**.
- De los que lo encuentran, ${all.length - lost.length - far.length} lo dan entre las ${SHOWN} primeras filas y ${far.length} más abajo (el nombre lo comparten muchos materiales).

| De dónde sale el nombre | Nombres | No lo encuentran | Más abajo de la fila ${SHOWN} |
|---|---|---|---|
${[...bySource].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `| ${k} | ${v.n} | ${v.lost} | ${v.far} |`).join("\n")}

${lost.length ? `**Los que no lo encuentran:**\n\n| Material | Nombre | De dónde sale | Motivo |\n|---|---|---|---|\n${lost.map((l) => `| ${cell(l.r.name)} | ${cell(l.name.text)} | ${l.name.from} | ${reasonOf(l) ?? "**sin explicar**"} |`).join("\n")}\n` : "Ningún nombre deja de encontrar su material.\n"}
${far.length ? `**Los que lo dan más abajo de la fila ${SHOWN}:**\n\n| Material | Nombre | Fila |\n|---|---|---|\n${far.map((l) => `| ${cell(l.r.name)} | ${cell(l.name.text)} | ${l.rank} |`).join("\n")}\n` : ""}
## 5.3 · El buscador no repite

- **Una fila por categoría:** en los ${results.length}, tu versión sale en la misma fila que su material común (V3-13). Hoy cada categoría tiene un solo material común (tanda 9): ninguna especie ni CAS se repite entre los tuyos.
- **Ningún nombre dos veces sin algo que lo distinga**, buscando el nombre de cada material y ${probes.map((p) => `«${p}»`).join(", ")}: ${listRepeats.size ? `${listRepeats.size} casos:\n\n${[...listRepeats].map(([k, qs]) => `  - ${k} (al buscar ${qs.map((q) => `«${q}»`).join(", ")})`).join("\n")}` : "ninguno. Tu versión y su común se llaman igual, pero una es tuya (con su tienda y su frasco) y la otra común."}
- **Ninguna fórmula guarda una categoría:** en el esquema, solo \`materials.category_id\` apunta a \`material_categories\` (las migraciones de \`v3/supabase/migrations/\`).

**Lo que da cada búsqueda de prueba** (filas, y cuántos materiales debajo):

${probeRows.map(({ q, rows }) => `- «${q}»: ${rows.length ? rows.map((r) => `${r.name} (${r.members.length})`).join(" · ") : "nada"}`).join("\n")}
`;
    writeFileSync(join(FOLDER, "buscador.md"), report, "utf8");
    expect(results).toHaveLength(111);
  });
});
