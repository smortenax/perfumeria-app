import { column, Schema, Table } from "@powersync/common";
import { PowerSyncDatabase } from "@powersync/node";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Ratio } from "../src/core/arith/ratio";
import { SupabaseConnector } from "../src/db/connector";
import { bigintFromText, ratioFromNumeric } from "../src/db/exact";
import { admin, signIn, type TestUser } from "./local";

/**
 * Plan v3, step 3.1: exact numbers survive the sync both ways. A copy of PowerSync in Node,
 * with the browser's core and its columns declared as text (src/db/local/schema.ts), uploads
 * with the app's own connector. Done when 9007199254740993 µg and
 * 0.000000000000000000000000000001 come back identical, down and up.
 */

const MASS = "9007199254740993"; // 2^53 + 1: a JavaScript number cannot hold it
const FRACTION = "0.000000000000000000000000000001"; // 30 decimals

const schema = new Schema({
  sync_checks: new Table({ owner_id: column.text, mass_ug: column.text, fraction: column.text, created_at: column.text }),
});

let a: TestUser;
let copy: PowerSyncDatabase;
let folder: string;

async function waitFor<T>(probe: () => Promise<T | null | undefined>): Promise<T> {
  const deadline = Date.now() + 30_000;
  for (;;) {
    const found = await probe();
    if (found) return found;
    if (Date.now() > deadline) throw new Error("timed out waiting for the sync");
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

beforeAll(async () => {
  a = await signIn("A");
  await admin`delete from sync_checks where owner_id = ${a.id}`;
  folder = mkdtempSync(join(tmpdir(), "perfumeria-v3-exact-"));
  copy = new PowerSyncDatabase({ schema, database: { dbFilename: "exact.sqlite", dbLocation: folder } });
  await copy.connect(new SupabaseConnector(a.db, () => "http://127.0.0.1:8080"));
  await copy.syncStream("exactness_checks").subscribe();
});

afterAll(async () => {
  await copy?.disconnectAndClear();
  await copy?.close();
  rmSync(folder, { recursive: true, force: true });
  await admin`delete from sync_checks where owner_id = ${a.id}`;
  await admin.end();
});

describe("exact numbers through the sync (V3-9)", () => {
  it("down: Supabase → the copy, as the same text", async () => {
    const [row] = await admin`insert into sync_checks (owner_id, mass_ug, fraction) values (${a.id}, ${MASS}, ${FRACTION}) returning id`;
    const local = await waitFor(() =>
      copy.getOptional<{ mass_ug: unknown; fraction: unknown }>("select mass_ug, fraction from sync_checks where id = ?", [row.id]),
    );
    expect(local.mass_ug).toBe(MASS);
    expect(local.fraction).toBe(FRACTION);
    expect(bigintFromText(local.mass_ug as string)).toBe(9007199254740993n);
    expect(ratioFromNumeric(local.fraction as string)).toEqual(Ratio.of(1n, 10n ** 30n));
  });

  it("up: the copy → Supabase, through the app's connector, identical", async () => {
    const id = randomUUID();
    await copy.execute("insert into sync_checks (id, owner_id, mass_ug, fraction) values (?, ?, ?, ?)", [id, a.id, MASS, FRACTION]);
    const [server] = await waitFor(async () => {
      const rows = await admin`select mass_ug::text as mass_ug, fraction::text as fraction from sync_checks where id = ${id}`;
      return rows.length > 0 ? rows : null;
    });
    expect(server.mass_ug).toBe(MASS);
    expect(server.fraction).toBe(FRACTION);
    expect((await copy.getUploadQueueStats()).count).toBe(0);
  });
});
