import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import { PowerSyncDatabase } from "@powersync/node";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Ratio } from "../src/core/arith/ratio";
import { formatPercent } from "../src/core/display";
import { checkIfra, type IfraData, type IfraReport } from "../src/core/ifra";
import { IfraSummary } from "../src/bench/IfraBox";
import { v3IdOf } from "../src/bench/v3-repository";
import type { Catalog } from "../src/db/catalog";
import { SupabaseConnector } from "../src/db/connector";
import { addEvent, createFormula, createWorkbench, loadFormula, type NewFormula } from "../src/db/formulas";
import { loadIfraLayer } from "../src/db/ifra-layer";
import { AppSchema, tables } from "../src/db/local/schema";
import { loadCatalog, type LocalDb } from "../src/db/materials";
import { toIfra } from "../src/db/to-ifra";
import { admin, signIn, type TestUser } from "./local";

/**
 * Plan v3, step 8.4, «hecho cuando»: the two readings of the workbench's IFRA panel, on the v3's
 * IFRA layer, agree with the reckoning by hand in three cases. The reckoning, with the ceilings and
 * where they come from, is in docs-v3/ifra-a-mano-8.4.md: category 4, ceilings of
 * datos/ifra_limits.csv (coumarin 1,5 %, IFRA_STD_023, amendment 49; OTNE 20 %, IFRA_STD_068,
 * amendment 49; eugenol 2,5 %, IFRA_STD_035, amendment 51). Each formula is poured as the workbench
 * writes it, read back from the copy, and the panel is drawn from its report.
 */

const TAG = "[prueba 8.4]";
const ENDPOINT = "http://127.0.0.1:8080";
const MG = 1_000n;
let a: TestUser;
let copy: PowerSyncDatabase;
let db: LocalDb;
let folder: string;
let catalog: Catalog;
let ifra: IfraData;
let bench: string;

async function waitFor<T>(probe: () => Promise<T | null | undefined | false>): Promise<T> {
  const deadline = Date.now() + 30_000;
  for (;;) {
    const found = await probe();
    if (found) return found;
    if (Date.now() > deadline) throw new Error("timed out waiting for the sync");
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

async function cleanUp(): Promise<void> {
  await admin`delete from formulas where name like ${TAG + "%"}`;
  await admin`delete from workbenches where name like ${TAG + "%"}`;
}

/** A common material of the copy by its name and CAS: the same one the bar finds. */
function common(name: string, cas: string): string {
  const found = [...catalog.materials.values()].filter((m) => m.ownerId === null && m.name === name && m.cas === cas);
  if (found.length !== 1) throw new Error(`«${name}» (${cas}) is ${found.length} common materials of the copy`);
  return found[0].id;
}

type Pour = readonly [material: string, massMg: bigint, percent?: string, diluent?: string];

/** Pours a formula as the workbench writes it, and reads its report back from the copy. */
async function reportOf(name: string, header: Omit<NewFormula, "name" | "workbenchId">, pours: readonly Pour[]): Promise<IfraReport> {
  const id = await createFormula(db, a.id, { name: `${TAG} ${name}`, workbenchId: bench, ...header });
  const idOf = v3IdOf({ catalog });
  for (const [material, massMg, percent = "100", diluent] of pours) {
    const fraction = Ratio.fromDecimal(percent).div(Ratio.of(100n));
    await addEvent(db, a.id, id, { kind: "add", materialId: material, massUg: massMg * MG, fraction, diluentId: diluent ? idOf(diluent) : null });
  }
  return checkIfra(await loadFormula(db, catalog, a.id, id), ifra);
}

/** The panel's two answers, as it draws them. */
function panel(report: IfraReport): { asIs: string; maxUse: string } {
  const html = renderToStaticMarkup(createElement(IfraSummary, { report, empty: false }));
  const answers = [...html.matchAll(/<span class="answer[^"]*">([^<]*)<\/span>/g)].map((m) => m[1]);
  return { asIs: answers[0], maxUse: answers[1].replace(/&nbsp;| /g, " ") };
}

beforeAll(async () => {
  a = await signIn("A");
  await cleanUp();
  folder = mkdtempSync(join(tmpdir(), "perfumeria-v3-ifra-"));
  copy = new PowerSyncDatabase({ schema: AppSchema, database: { dbFilename: "ifra.sqlite", dbLocation: folder } });
  db = wrapPowerSyncWithDrizzle(copy, { schema: tables });
  await copy.connect(new SupabaseConnector(a.db, () => ENDPOINT));
  catalog = await waitFor(async () => {
    const c = await loadCatalog(db, a.id);
    return [...c.materials.values()].some((m) => m.ownerId === null && m.cas === "91-64-5") ? c : null;
  });
  ifra = toIfra(catalog, await loadIfraLayer(db));
  bench = await createWorkbench(db, a.id, { name: `${TAG} banco` });
});

afterAll(async () => {
  await waitFor(async () => (await copy.getUploadQueueStats()).count === 0).catch(() => undefined);
  await copy?.disconnectAndClear();
  await copy?.close();
  rmSync(folder, { recursive: true, force: true });
  await cleanUp();
  await admin.end();
});

describe("the two readings agree with the reckoning by hand (8.4)", () => {
  it("case 1, the bottle as it is: coumarin at 3 % goes over its 1,5 %, OTNE at its 20 % does not; up to 50 %", async () => {
    const report = await reportOf("caso 1", {}, [
      [common("Cumarina natural", "91-64-5"), 30n],
      [common("Iso E Super", "54464-57-2"), 200n],
      [common("Etanol", "64-17-5"), 770n],
    ]);
    expect(report.base).toBe("bottle");
    expect(report.finalUg.eq(Ratio.of(1_000n * MG))).toBe(true);
    expect(report.asIs).toBe("no");
    expect(report.maxUse.eq(Ratio.of(1n, 2n))).toBe(true);
    expect(report.partial).toBe(false);
    expect(panel(report)).toEqual({ asIs: "No", maxUse: "50,00 %" });
  });

  it("case 2, a final batch of 2 g and eugenol from two pours, one at 10 % in DPG: 1,5 % of 2,5 %; up to 7,75/30", async () => {
    const report = await reportOf("caso 2", { finalBatchUg: 2_000n * MG }, [
      [common("Eugenol 98%", "97-53-0"), 10n],
      [common("Eugenol 98%", "97-53-0"), 200n, "10", "solv:dpg"],
      [common("Iso E Super", "54464-57-2"), 100n],
    ]);
    expect(report.base).toBe("now");
    expect(report.finalUg.eq(Ratio.of(2_000n * MG))).toBe(true);
    // 30 mg of eugenol over 2 000 mg; 100 mg of OTNE over 2 000 mg.
    expect(report.checks.map((c) => formatPercent(c.worstUg.div(report.finalUg), 2)).sort()).toEqual(["1,50 %", "5,00 %"]);
    expect(report.asIs).toBe("yes");
    // 0,025 × 310 / 30 = 7,75/30 = 31/120.
    expect(report.maxUse.eq(Ratio.of(31n, 120n))).toBe(true);
    expect(panel(report)).toEqual({ asIs: "Sí", maxUse: "25,83 %" });
  });

  it("case 3, half of a 1 g work batch for 10 g: fine as it is now, over once completed; up to 7,5 %", async () => {
    const report = await reportOf("caso 3", { workBatchUg: 1_000n * MG, finalBatchUg: 10_000n * MG }, [
      [common("Cumarina natural", "91-64-5"), 100n],
      [common("Iso E Super", "54464-57-2"), 90n],
      [common("Etanol", "64-17-5"), 310n],
    ]);
    const now = report.readings.find((r) => r.base === "now")!;
    const completed = report.readings.find((r) => r.base === "completed")!;
    // Now: over the 10 g of the final batch; completed: 500 mg × 10 g / 1 g = 5 g.
    expect(now.finalUg.eq(Ratio.of(10_000n * MG))).toBe(true);
    expect(completed.finalUg.eq(Ratio.of(5_000n * MG))).toBe(true);
    expect(now.asIs).toBe("yes");
    expect(completed.asIs).toBe("no");
    expect(report.base).toBe("completed");
    expect(report.asIs).toBe("no");
    // 0,015 × 500 / 100 = 0,075; OTNE gives 0,2 × 500 / 90 > 1.
    expect(report.maxUse.eq(Ratio.of(3n, 40n))).toBe(true);
    expect(panel(report)).toEqual({ asIs: "No", maxUse: "7,50 %" });
    // The panel's switch to the other base reads it as it is now.
    const html = renderToStaticMarkup(createElement(IfraSummary, { report, empty: false, base: "now" }));
    expect(html).toContain(">Sí<");
  });
});

