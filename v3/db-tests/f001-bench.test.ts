import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import { PowerSyncDatabase } from "@powersync/node";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import { Ratio } from "../src/core/arith/ratio";
import { compose } from "../src/core/compose";
import { formatPercent } from "../src/core/display";
import { F001_LINES, f001 } from "../src/core/fixtures/f001";
import { eventOf } from "../src/bench/events";
import { v3IdOf } from "../src/bench/v3-repository";
import { SupabaseConnector } from "../src/db/connector";
import { addEvent, createFormula, createWorkbench, loadFormula } from "../src/db/formulas";
import { AppSchema, tables } from "../src/db/local/schema";
import { createMaterial, loadCatalog, type LocalDb } from "../src/db/materials";
import { admin, signIn, type TestUser } from "./local";

/**
 * Plan v3, step 8.2, «hecho cuando»: the F-001 made again from nothing, by the way the workbench
 * writes it (each pour, the event of eventOf, with the bar's diluents as the common ones), gives the
 * numbers of the notebook. Its materials are provisional ones of A's: the numbers do not depend on them.
 */

const TAG = "[prueba 8.2]";
const ENDPOINT = "http://127.0.0.1:8080";
let a: TestUser;
let copy: PowerSyncDatabase;
let db: LocalDb;
let folder: string;

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
  await admin`delete from materials where name like ${TAG + "%"}`;
}

beforeAll(async () => {
  a = await signIn("A");
  await cleanUp();
  folder = mkdtempSync(join(tmpdir(), "perfumeria-v3-f001-"));
  copy = new PowerSyncDatabase({ schema: AppSchema, database: { dbFilename: "f001.sqlite", dbLocation: folder } });
  db = wrapPowerSyncWithDrizzle(copy, { schema: tables });
  await copy.connect(new SupabaseConnector(a.db, () => ENDPOINT));
  // The common diluents, downloaded.
  await waitFor(async () => [...(await loadCatalog(db, a.id)).materials.values()].some((m) => m.solvent && /^dpg/i.test(m.name)));
});

afterAll(async () => {
  // What went up, all of it, before it is cleaned up: nothing arrives after.
  await waitFor(async () => (await copy.getUploadQueueStats()).count === 0).catch(() => undefined);
  await copy?.disconnectAndClear();
  await copy?.close();
  rmSync(folder, { recursive: true, force: true });
  await cleanUp();
  await admin.end();
});

it("the F-001, poured again in the workbench's way, weighs as the notebook", async () => {
  const bench = await createWorkbench(db, a.id, { name: `${TAG} banco` });
  const formulaId = await createFormula(db, a.id, { name: `${TAG} Lejía`, workbenchId: bench });
  const made = new Map<string, string>();
  for (const change of f001().history) {
    if (change.kind !== "add" || change.material.key.startsWith("solv:")) continue;
    made.set(change.material.key, await createMaterial(db, a.id, { name: `${TAG} ${change.material.name}`, kind: "provisional" }));
  }
  const catalog = await loadCatalog(db, a.id);
  const common = v3IdOf({ catalog });
  const idOf = (key: string) => made.get(key) ?? common(key);
  for (const change of f001().history) await addEvent(db, a.id, formulaId, eventOf(change, idOf));

  const c = compose(await loadFormula(db, catalog, a.id, formulaId));
  const partOf = (id: string) => c.parts.find((p) => p.material.key === id)?.massUg ?? Ratio.ZERO;
  expect(c.totalUg.eq(Ratio.of(8_745_000))).toBe(true);
  expect(c.aromaticUg.eq(Ratio.of(2_451_900))).toBe(true);
  expect(formatPercent(c.aromaticUg.div(c.totalUg), 2)).toBe("28,04 %");
  for (const [name, labId, , , , pureGrams, percent] of F001_LINES) {
    if (labId === "alcohol") continue;
    const id = made.get(`lab:${labId}`)!;
    expect(partOf(id).eq(Ratio.fromDecimal(pureGrams).mul(Ratio.of(1_000_000))), name).toBe(true);
    expect(formatPercent(partOf(id).div(c.totalUg)), name).toBe(`${percent} %`);
  }
  expect(partOf(common("solv:dpg")).eq(Ratio.of(724_600))).toBe(true);
  expect(formatPercent(partOf(common("solv:dpg")).div(c.totalUg), 2)).toBe("8,29 %");
  expect(partOf(common("solv:alcohol")).eq(Ratio.of(5_568_500))).toBe(true);
  expect(formatPercent(partOf(common("solv:alcohol")).div(c.totalUg), 2)).toBe("63,68 %");
});
