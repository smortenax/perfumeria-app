import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Las reglas duras de la migración (V3-111, el usuario 2026-11-25: «reglas duras con lo que respecta a
 * los problemas encontrados para que no se tenga que ir limpiando el codigo cada tanto»). Están en
 * `LEEME.md`, «Reglas duras». Corre con `npx vitest run --config migracion-v3/vitest.config.ts`.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const scripts = readdirSync(HERE).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts") && f !== "vitest.config.ts");
const read = (f: string) => readFileSync(join(HERE, f), "utf8");

describe("M1: una tanda usa los ayudantes de lib/ y no los copia", () => {
  it("nadie fuera de lib/ define asCells, mdCell ni su propio cell() de Markdown", () => {
    const copies = scripts.filter((f) => /^(const|function)\s+(asCells|mdCell|mdCellKeepLines)\b|^const cell = \(t: string\)/m.test(read(f)));
    expect(copies).toEqual([]);
  });
});

/**
 * Las tandas que sacan su BASE del HEAD de ese momento: volver a correrlas otro día da otros bytes.
 * Es la deuda del 2026-11-25 y solo puede menguar; una tanda nueva fija su BASE (un commit escrito o
 * `process.env.BASE`, que el informe cita).
 */
const BASE_FROM_HEAD = [
  "tanda-43-impacto.ts",
  "tanda-44-impacto-elegido.ts",
  "tanda-46-completar-comunes.ts",
  "tanda-47-maese-moleculas.ts",
  "tanda-48-maese-naturales.ts",
  "tanda-51-composicion-naturales.ts",
  "tanda-55-tocoferol.ts",
  "tanda-56-maese-en-comunes.ts",
];

describe("M2: la BASE de una tanda es un commit fijo", () => {
  it("solo las tandas de la lista la sacan del HEAD sin poder fijarla", () => {
    const fromHead = scripts.filter((f) => /const BASE = execSync\(/.test(read(f))).sort();
    expect(fromHead).toEqual([...BASE_FROM_HEAD].sort());
  });
});
