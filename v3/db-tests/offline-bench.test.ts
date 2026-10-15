import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import { PowerSyncDatabase } from "@powersync/node";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import { Ratio } from "../src/core/arith/ratio";
import { compose } from "../src/core/compose";
import { checkIfra } from "../src/core/ifra";
import { v3IdOf } from "../src/bench/v3-repository";
import { SupabaseConnector } from "../src/db/connector";
import { addEvent, createFormula, createWorkbench, loadFormula } from "../src/db/formulas";
import { loadIfraLayer } from "../src/db/ifra-layer";
import { AppSchema, tables } from "../src/db/local/schema";
import { loadCatalog, type LocalDb } from "../src/db/materials";
import { ifraCard, toIfra } from "../src/db/to-ifra";
import { admin, signIn, type TestUser } from "./local";

/**
 * Plan v3, step 8.7 (V3-9): with the network cut, A weighs a whole formula in the workbench, with
 * IFRA, on its copy; when the network comes back, the history goes up complete and without
 * duplicates, and another browser of A's reads the same formula and the same IFRA report.
 */

const TAG = "[prueba 8.7]";
const ENDPOINT = "http://127.0.0.1:8080";
let a: TestUser;
const copies: Array<{ copy: PowerSyncDatabase; folder: string }> = [];

async function waitFor<T>(probe: () => Promise<T | null | undefined | false>): Promise<T> {
  const deadline = Date.now() + 30_000;
  for (;;) {
    const found = await probe();
    if (found) return found;
    if (Date.now() > deadline) throw new Error("timed out waiting for the sync");
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

/** A browser of A's: its own copy, signed in and downloaded. */
async function browser(name: string): Promise<{ copy: PowerSyncDatabase; db: LocalDb }> {
  const folder = mkdtempSync(join(tmpdir(), `perfumeria-v3-${name}-`));
  const copy = new PowerSyncDatabase({ schema: AppSchema, database: { dbFilename: `${name}.sqlite`, dbLocation: folder } });
  copies.push({ copy, folder });
  const db = wrapPowerSyncWithDrizzle(copy, { schema: tables });
  await copy.connect(new SupabaseConnector(a.db, () => ENDPOINT));
  await waitFor(async () => [...(await loadCatalog(db, a.id)).materials.values()].some((m) => m.ownerId === null && m.cas === "78-70-6"));
  return { copy, db };
}

/** A report as text, to compare two: its exact figures as they are. */
const asText = (value: unknown) => JSON.stringify(value, (_, v: unknown) => (typeof v === "bigint" ? v.toString() : v));

async function cleanUp(): Promise<void> {
  await admin`delete from formulas where name like ${TAG + "%"}`;
  await admin`delete from workbenches where name like ${TAG + "%"}`;
}

beforeAll(async () => {
  a = await signIn("A");
  await cleanUp();
});

afterAll(async () => {
  for (const { copy, folder } of copies) {
    await copy.disconnectAndClear();
    await copy.close();
    rmSync(folder, { recursive: true, force: true });
  }
  await cleanUp();
  await admin.end();
});

it("without network A weighs a formula with IFRA; back online, the history goes up whole, once, and another browser reads the same", async () => {
  const { copy, db } = await browser("bench-offline");
  await copy.disconnect();
  expect(copy.currentStatus.connected).toBe(false);

  // Weighing, as the workbench writes it: common materials, the bar's diluents, a change of mass and a note.
  const catalog = await loadCatalog(db, a.id);
  const common = (cas: string) => {
    const found = [...catalog.materials.values()].find((m) => m.ownerId === null && m.cas === cas);
    if (!found) throw new Error(`the common material ${cas} is not in the copy (load the commons first)`);
    return found.id;
  };
  const idOf = v3IdOf({ catalog });
  const layer = await loadIfraLayer(db);
  // A common material with a ceiling in IFRA, so that the report has something to check.
  const capped = [...catalog.materials.values()].find((m) => m.ownerId === null && !m.solvent && ifraCard(catalog, layer, m.id).state === "ceiling");
  if (!capped) throw new Error("no common material with a ceiling in the copy (load the commons and the IFRA layer first)");
  const bench = await createWorkbench(db, a.id, { name: `${TAG} banco` });
  const formulaId = await createFormula(db, a.id, { name: `${TAG} sin red`, workbenchId: bench });
  const pct = (text: string) => Ratio.fromDecimal(text).div(Ratio.of(100n));
  const linalool = await addEvent(db, a.id, formulaId, { kind: "add", materialId: common("78-70-6"), massUg: 1_500_000n, fraction: pct("10"), diluentId: idOf("solv:dpg") });
  await addEvent(db, a.id, formulaId, { kind: "add", materialId: capped.id, massUg: 300_000n, fraction: Ratio.ONE, diluentId: null });
  await addEvent(db, a.id, formulaId, { kind: "add", materialId: idOf("solv:alcohol"), massUg: 4_000_000n, fraction: Ratio.ONE, diluentId: null });
  await addEvent(db, a.id, formulaId, { kind: "set_mass", target: linalool, massUg: 1_200_000n });
  await addEvent(db, a.id, formulaId, { kind: "note", text: "pesada sin red" });

  const ifra = toIfra(catalog, layer);
  const formula = await loadFormula(db, catalog, a.id, formulaId);
  const offline = checkIfra(formula, ifra);
  expect(formula.history).toHaveLength(5);
  expect(compose(formula).totalUg.eq(Ratio.of(5_500_000))).toBe(true);
  // IFRA is read from the copy: the material with a ceiling is checked.
  expect(offline.checks.length).toBeGreaterThan(0);
  expect((await copy.getUploadQueueStats()).count).toBeGreaterThan(0);
  expect(await admin`select id from formulas where id = ${formulaId}`).toEqual([]);

  // The network comes back: everything goes up, once.
  await copy.connect(new SupabaseConnector(a.db, () => ENDPOINT));
  await waitFor(async () => (await copy.getUploadQueueStats()).count === 0);
  expect(await copy.getAll("select * from upload_rejections")).toEqual([]);
  const ids = (await admin`select id from formula_events where formula_id = ${formulaId} order by id`).map((r) => r.id as string);
  expect(ids).toEqual(formula.history.map((c) => c.id));

  // Another browser of A's reads the same formula and the same report.
  const other = await browser("bench-other");
  const otherCatalog = await loadCatalog(other.db, a.id);
  const read = await waitFor(async () => {
    try {
      const f = await loadFormula(other.db, otherCatalog, a.id, formulaId);
      return f.history.length === 5 ? f : null;
    } catch {
      return null;
    }
  });
  const online = checkIfra(read, toIfra(otherCatalog, await loadIfraLayer(other.db)));
  expect(asText(read)).toBe(asText(formula));
  expect(asText(online)).toBe(asText(offline));
});
