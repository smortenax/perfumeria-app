import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { getTableColumns, getTableName, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { SQLiteTable } from "drizzle-orm/sqlite-core";
import { afterAll, describe, expect, it } from "vitest";
import * as checks from "../db/schema/checks";
import * as formulas from "../db/schema/formulas";
import * as ifra from "../db/schema/ifra";
import * as materials from "../db/schema/materials";
import * as tastings from "../db/schema/tastings";
import * as local from "./db/local/schema";

/**
 * The hard rules of the code (V3-111, the user 2026-11-25: «lo que se tendra que apuntar son reglas
 * duras con lo que respecta a los problemas encontrados para que no se tenga que ir limpiando el
 * codigo cada tanto»). Each one is in v3/CLAUDE.md, «Reglas duras del código».
 *
 * Where there is debt today, the rule is a ratchet: `rules.baseline.json` keeps today's figure per file,
 * and the test fails both when a figure goes up (the rule is broken) and when it goes down (the
 * baseline must come down with it, so the improvement cannot be undone). After lowering a figure:
 * `RULES_WRITE=1 npx vitest run src/rules.node.test.ts`, and commit the baseline with the change. A figure
 * that goes up needs the user's yes, quoted in the commit. A file not in the baseline has ceiling 0.
 */

const V3 = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(V3, "src");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

/** The app's own code: not Designboard's runtime, which is copied whole from its repository. */
const files = walk(SRC)
  .map((p) => relative(SRC, p).split("\\").join("/"))
  .filter((p) => !p.startsWith("designboard/"));
const code = files.filter((p) => /\.(ts|tsx)$/.test(p) && !/\.test\.ts$/.test(p) && !p.includes("/fixtures/"));
const css = files.filter((p) => p.endsWith(".css"));
const read = (p: string) => readFileSync(join(SRC, p), "utf8");
/** The text without its comments, so a rule counts code and not the words that explain it. */
const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

/** Count of a pattern per file, the files with none left out. */
function perFile(list: readonly string[], pattern: RegExp, keepComments = false): Record<string, number> {
  const found: Record<string, number> = {};
  for (const p of list) {
    const text = keepComments ? read(p) : stripComments(read(p));
    const n = text.match(pattern)?.length ?? 0;
    if (n > 0) found[p] = n;
  }
  return found;
}

const BASELINE_FILE = join(SRC, "rules.baseline.json");
type Baseline = Record<string, Record<string, number> | string[]>;
const baseline = JSON.parse(readFileSync(BASELINE_FILE, "utf8")) as Baseline;
const measured: Baseline = {};
const writing = !!process.env.RULES_WRITE;
afterAll(() => {
  if (writing) writeFileSync(BASELINE_FILE, `${JSON.stringify(measured, null, 2)}\n`);
});
const HELP = "Mira v3/CLAUDE.md, «Reglas duras del código».";

/** A ratchet per file: no file above its figure in the baseline, and none below it either. */
function ratchet(name: string, counts: Record<string, number>) {
  const sorted = Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
  measured[name] = sorted;
  if (writing) return;
  const ceilings = (baseline[name] ?? {}) as Record<string, number>;
  const over = Object.entries(sorted)
    .filter(([file, n]) => n > (ceilings[file] ?? 0))
    .map(([file, n]) => `${file}: ${n} (tope ${ceilings[file] ?? 0})`);
  expect(over, `${name}: por encima del tope. ${HELP}`).toEqual([]);
  const under = Object.entries(ceilings)
    .filter(([file, n]) => (sorted[file] ?? 0) < n)
    .map(([file, n]) => `${file}: ${sorted[file] ?? 0} (tope ${n})`);
  expect(under, `${name}: ha bajado. Baja el tope con RULES_WRITE=1 y súbelo con el cambio.`).toEqual([]);
}

/** The same for a list: nothing new in it, and nothing in the baseline that is gone. */
function ratchetList(name: string, items: string[]) {
  const sorted = [...new Set(items)].sort();
  measured[name] = sorted;
  if (writing) return;
  const allowed = new Set((baseline[name] ?? []) as string[]);
  expect(sorted.filter((i) => !allowed.has(i)), `${name}: nuevo. ${HELP}`).toEqual([]);
  expect([...allowed].filter((i) => !sorted.includes(i)), `${name}: ya no está. Bájalo con RULES_WRITE=1.`).toEqual([]);
}

// ——— R1. Design values come from theme/tokens.css ———

describe("R1: colours, spaces and design sizes come from the tokens", () => {
  it("no colour is written outside theme/tokens.css", () => {
    const colour = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g;
    ratchet("R1 colours in CSS", perFile(css.filter((p) => p !== "theme/tokens.css"), colour));
    ratchet("R1 colours in code", perFile(code, colour));
  });

  it("spaces in CSS come from tokens: the hand-written px and rem in gap, padding and margin only go down", () => {
    const space = /(?:^|[;{\s])(?:gap|row-gap|column-gap|padding|margin)(?:-[a-z]+)?\s*:[^;}]*?\b\d*\.?\d+(?:px|rem)/gm;
    ratchet("R1 spaces in CSS", perFile(css, space));
  });

  it("styles live in CSS: the inline style={{…}} only go down", () => {
    ratchet("R1 inline styles", perFile(code, /style=\{\{/g));
  });
});

// ——— R2. One CSS file per selector ———

describe("R2: a selector is defined in one CSS file", () => {
  it("the selectors defined in more than one file only go down", () => {
    const owners = new Map<string, Set<string>>();
    for (const p of css) {
      const text = stripComments(read(p)).replace(/@media[^{]*\{/g, "");
      for (const m of text.matchAll(/(^|\})\s*([^{}@]+?)\s*\{/g)) {
        for (const selector of m[2].split(",").map((s) => s.trim().replace(/\s+/g, " "))) {
          if (!selector || /^(from|to|\d+%)$/.test(selector)) continue;
          owners.set(selector, (owners.get(selector) ?? new Set()).add(p));
        }
      }
    }
    const shared = [...owners].filter(([, set]) => set.size > 1).map(([s, set]) => `${s} (${[...set].sort().join(", ")})`).sort();
    ratchetList("R2 shared selectors", shared);
  });
});

// ——— R3. Units and rounding in one place ———

describe("R3: masses, percentages and their rounding go through core/arith/units and the format modules", () => {
  const OWNERS = new Set(["core/arith/units.ts", "core/display.ts"]);
  const owners = { has: (p: string) => OWNERS.has(p) || p.startsWith("format/") };
  it("the micrograms in a gram are written once (core/arith/units.ts)", () => {
    ratchet("R3 1_000_000n", perFile(code.filter((p) => !owners.has(p)), /1_000_000n|1000000n|UG_PER_G\s*=/g));
  });
  it("numbers are rounded for people only in the format modules: toFixed and toLocaleString elsewhere only go down", () => {
    ratchet("R3 rounding", perFile(code.filter((p) => !owners.has(p)), /\.toFixed\(|\.toLocaleString\(|Intl\.NumberFormat/g));
  });
});

// ——— R4. The browser's memory, in one place ———

describe("R4: only src/storage.ts touches the browser's storage", () => {
  it("no localStorage or sessionStorage elsewhere", () => {
    ratchet("R4 storage", perFile(code.filter((p) => p !== "storage.ts"), /\b(localStorage|sessionStorage)\b/g));
  });
});

// ——— R5. Each folder is a screen; the common pieces have their own folders ———

/** The screens: a folder each. What they share lives in core, db, lib, ui, families, i18n, theme or the top of src. */
const SCREENS = ["bench", "glossary", "dilution", "tasting", "planner", "labels", "formulation", "shopping", "export", "import"];
const screenOf = (p: string) => (SCREENS.includes(p.split("/")[0]) ? p.split("/")[0] : null);

describe("R5: a screen does not reach into another screen's folder", () => {
  it("the imports from one screen to another only go down", () => {
    const edges: string[] = [];
    for (const p of code) {
      const from = screenOf(p);
      if (!from) continue;
      for (const m of read(p).matchAll(/from\s+["'](\.\.?\/[^"'?]+)/g)) {
        const target = join(dirname(p), m[1]).split("\\").join("/");
        const to = screenOf(target);
        if (to && to !== from) edges.push(`${p} -> ${target}`);
      }
    }
    // Lo común va a lib/, ui/ o db/; abrir otra pantalla, por su componente de entrada.
    ratchetList("R5 cross-screen imports", edges);
  });

  it("the common folders import no screen (the shell, App.tsx and Home.tsx, opens them)", () => {
    const SHELL = ["App.tsx", "Home.tsx", "main.tsx"];
    const common = code.filter((p) => !screenOf(p) && !p.includes("/") && !SHELL.includes(p));
    const commonFolders = code.filter((p) => ["core", "db", "lib", "ui", "families", "i18n"].includes(p.split("/")[0]));
    const offenders: string[] = [];
    for (const p of [...common, ...commonFolders]) {
      for (const m of read(p).matchAll(/from\s+["'](\.\.?\/[^"'?]+)/g)) {
        const target = join(dirname(p), m[1]).split("\\").join("/");
        if (screenOf(target)) offenders.push(`${p} -> ${target}`);
      }
    }
    ratchetList("R5 common -> screen", offenders);
  });
});

// ——— R6. Nothing of Tauri, nothing outside v3/ ———

describe("R6: the v3 is a web app on its own (V3-8, V3-21)", () => {
  it("no Tauri in the code or the dependencies", () => {
    ratchet("R6 tauri", perFile(code, /@tauri-apps/g, true));
    const pkg = JSON.parse(readFileSync(join(V3, "package.json"), "utf8")) as { dependencies?: object; devDependencies?: object };
    expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((d) => d.includes("tauri"))).toEqual([]);
  });
  it("no import reaches outside v3/", () => {
    const outside: string[] = [];
    for (const p of code) {
      for (const m of read(p).matchAll(/from\s+["'](\.\.?\/[^"'?]+)/g)) {
        if (relative(V3, join(SRC, dirname(p), m[1])).startsWith("..")) outside.push(`${p}: ${m[1]}`);
      }
    }
    expect(outside).toEqual([]);
  });
});

// ——— R7. Large files are split ———

/** Over this many lines a file is split (state in a hook, drawing in components), unless it is below. */
const MAX_LINES = 600;

describe("R7: no file of code grows past 600 lines", () => {
  it("the files over the limit are these, and they only shrink", () => {
    const counts: Record<string, number> = {};
    // Lines of code: not the imports, which grow as a file is split; not the text catalogs of i18n/.
    for (const p of code.filter((f) => !f.startsWith("i18n/"))) {
      const n = read(p).split("\n").filter((l) => !/^import\s|^\s+[\w{},\s]*\}?\s*from\s+["']/.test(l)).length;
      if (n > MAX_LINES) counts[p] = n;
    }
    ratchet("R7 long files", counts);
  });
});

// ——— R8. The three copies of the schema agree ———

/** Tables that live only in the browser, on purpose. */
const LOCAL_ONLY = ["upload_rejections"];
/** Tables that live only in Postgres, on purpose. */
const SERVER_ONLY = ["sync_checks", "reference_perfumes"];

describe("R8: Postgres, the browser's copy and PowerSync's rules have the same tables and columns", () => {
  const server = new Map<string, Set<string>>();
  for (const mod of [materials, checks, ifra, formulas, tastings]) {
    for (const v of Object.values(mod)) if (is(v, PgTable)) server.set(getTableName(v), new Set(Object.values(getTableColumns(v)).map((c) => c.name)));
  }
  const browser = new Map<string, Set<string>>();
  for (const v of Object.values(local)) if (is(v, SQLiteTable)) browser.set(getTableName(v), new Set(Object.values(getTableColumns(v)).map((c) => c.name)));

  it("every table is in both, or declared as only one side's", () => {
    expect([...browser.keys()].filter((t) => !server.has(t) && !LOCAL_ONLY.includes(t)).sort(), "solo en el navegador, sin declarar").toEqual([]);
    expect([...server.keys()].filter((t) => !browser.has(t) && !SERVER_ONLY.includes(t)).sort(), "solo en Postgres, sin declarar").toEqual([]);
  });

  it("each shared table has the same columns", () => {
    const drift: string[] = [];
    for (const [table, cols] of browser) {
      const pg = server.get(table);
      if (!pg) continue;
      for (const c of pg) if (!cols.has(c)) drift.push(`${table}.${c}: solo en Postgres`);
      for (const c of cols) if (!pg.has(c)) drift.push(`${table}.${c}: solo en el navegador`);
    }
    expect(drift.sort()).toEqual([]);
  });

  it("PowerSync syncs exactly the browser's tables", () => {
    const rules = readFileSync(join(V3, "powersync/sync-config.yaml"), "utf8");
    const synced = new Set([...rules.matchAll(/\bFROM\s+([a-z_]+)/g)].map((m) => m[1]));
    expect([...browser.keys()].filter((t) => !synced.has(t) && !LOCAL_ONLY.includes(t)).sort(), "en el navegador y sin regla de PowerSync").toEqual([]);
    expect([...synced].filter((t) => !browser.has(t) && !SERVER_ONLY.includes(t)).sort(), "con regla de PowerSync y sin tabla en el navegador").toEqual([]);
  });
});
