import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import { PowerSyncDatabase } from "@powersync/node";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import { SupabaseConnector } from "../src/db/connector";
import { AppSchema, tables } from "../src/db/local/schema";
import { loadCatalog, type LocalDb } from "../src/db/materials";
import {
  addStrip, closeStrip, createSession, ensureMoment, loadTastings, revealStrip, saveClosure, setBattery, setCurve, setFamily, setMark, updateMoment,
  writeOpening,
} from "../src/db/tastings";
import { admin, download, downloadWhen, has, signIn, type TestUser } from "./local";

/**
 * The tastings (V3-60 to V3-63) from end to end: a session written on A's copy through the app's own
 * code goes up whole and is not refused; then what Supabase keeps whoever writes: only yours, the
 * opening never corrected, the comparison only with the series closed, the codes fixed, and nothing
 * written in materials.
 */

const TAG = "[prueba catas]";
const ENDPOINT = "http://127.0.0.1:8080";
let a: TestUser;
let b: TestUser;
let copy: PowerSyncDatabase;
let db: LocalDb;
let folder: string;
let common: string;
let dilution: string;
const made: Record<string, string> = {};

async function waitFor<T>(probe: () => Promise<T | null | undefined | false>): Promise<T> {
  const deadline = Date.now() + 30_000;
  for (;;) {
    const found = await probe();
    if (found) return found;
    if (Date.now() > deadline) throw new Error("timed out waiting for the sync");
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}
const fails = (query: PromiseLike<unknown>, code = "23514") => expect(Promise.resolve(query)).rejects.toMatchObject({ code });

beforeAll(async () => {
  [a, b] = await Promise.all([signIn("A"), signIn("B")]);
  await admin`delete from materials where name like ${TAG + "%"}`;
  [{ id: common }] = await admin`insert into materials (name, kind) values (${`${TAG} Galaxolide`}, 'molecule') returning id`;
  [{ id: dilution }] = await admin`
    insert into lab_dilutions (user_id, material_id, fraction, solvent, made_on) values (${a.id}, ${common}, 0.1, 'DPG', '2026-08-04') returning id`;
  folder = mkdtempSync(join(tmpdir(), "perfumeria-v3-tastings-"));
  copy = new PowerSyncDatabase({ schema: AppSchema, database: { dbFilename: "tastings.sqlite", dbLocation: folder } });
  db = wrapPowerSyncWithDrizzle(copy, { schema: tables });
  await copy.connect(new SupabaseConnector(a.db, () => ENDPOINT));
  await waitFor(async () => (await loadCatalog(db, a.id)).dilutions.get(common)?.length);
});

afterAll(async () => {
  await copy?.disconnectAndClear();
  await copy?.close();
  rmSync(folder, { recursive: true, force: true });
  await admin`delete from tasting_sessions where user_id in (${a.id}, ${b.id}) and note like ${TAG + "%"}`;
  await admin`delete from materials where name like ${TAG + "%"}`;
  await admin.end();
});

it("a whole tasting written on your copy goes up, refused nowhere, and writes nothing in the material", async () => {
  const [before] = await admin`select updated_at, family from materials where id = ${common}`;
  const session = await createSession(db, a.id, `${TAG} sesión`);
  const strip = await addStrip(db, a.id, session, { materialId: common, dilutionId: dilution, dose: "2 gotas" });
  await writeOpening(db, a.id, strip, "ropa limpia, detergente floral");
  const t5 = await ensureMoment(db, a.id, strip, "t5");
  await updateMoment(db, a.id, t5, { text: "floral jabonoso", intensity: 3, nearDetectable: true, complexity: "simple", puff: "b1", texture: "sedoso" });
  await setFamily(db, a.id, t5, "calkin", "floral", true);
  await setFamily(db, a.id, t5, "app", "floral", true);
  await setBattery(db, a.id, t5, "soapy", "yes");
  await setBattery(db, a.id, t5, "green", "unsure");
  for (const seg of [1, 2, 3, 4]) await setCurve(db, a.id, t5, seg, "mid");
  await revealStrip(db, a.id, strip);
  const t30 = await ensureMoment(db, a.id, strip, "t30");
  await updateMoment(db, a.id, t30, { reviewed: ["curve", "intensity"], nearDetectable: true });
  await saveClosure(db, a.id, strip, { role: "holds", effectRichness: "fresh", effectEnergy: "gentle", versatility: "congenial", decay: "fades", biases: ["informed"] });
  await expect(saveClosure(db, a.id, strip, { comparison: "antes de cerrar" })).rejects.toThrow(/after closing/);
  await closeStrip(db, a.id, strip);
  await saveClosure(db, a.id, strip, { comparison: "Fuente: almizclada. Cuatro coincidencias." });
  await setMark(db, a.id, common, "pedido 2026-10-18");
  Object.assign(made, { session, strip, t5, t30 });

  const [closure] = await waitFor(async () => {
    const rows = await admin`select comparison, biases, role from tasting_closures where strip_id = ${strip}`;
    return rows.length && rows[0].comparison ? rows : null;
  });
  expect(closure).toMatchObject({ role: "holds", biases: ["informed"] });
  await waitFor(async () => (await admin`select 1 from tasting_marks where material_id = ${common} and user_id = ${a.id}`).length);
  const [s] = await admin`select fraction::text, solvent, blind_label, revealed_at is not null as revealed, closed_at is not null as closed from tasting_strips where id = ${strip}`;
  expect(s).toEqual({ fraction: "0.1", solvent: "DPG", blind_label: "A", revealed: true, closed: true });
  const moments = await admin`select moment, text, reviewed, near_detectable from tasting_moments where strip_id = ${strip} order by moment`;
  expect(moments.map((m) => m.moment)).toEqual(["t0", "t30", "t5"]);
  expect(moments.find((m) => m.moment === "t30")?.reviewed).toEqual(["curve", "intensity"]);
  expect((await admin`select count(*)::int as n from tasting_curve where moment_id = ${t5}`)[0].n).toBe(4);
  expect((await admin`select code from tasting_families where moment_id = ${t5} order by scheme`).map((r) => r.code)).toEqual(["floral", "floral"]);
  expect(await copy.getAll("select * from upload_rejections")).toEqual([]);
  const [after] = await admin`select updated_at, family from materials where id = ${common}`;
  expect(after).toEqual(before);
  // Read back from the copy, as the screen does.
  const read = await loadTastings(db, a.id);
  expect(read.moments.find((m) => m.id === t5)?.battery.get("soapy")).toBe("yes");
  expect(read.marks.get(common)).toBe("pedido 2026-10-18");
});

it("the opening is written once: Supabase refuses to change it or to delete it while its strip lives", async () => {
  const t0 = (await admin`select id from tasting_moments where strip_id = ${made.strip} and moment = 't0'`)[0].id as string;
  const { error } = await a.db.from("tasting_moments").update({ text: "otra cosa" }).eq("id", t0);
  expect(error?.code).toBe("23514");
  // Sent again the same (an upload retried), it passes.
  const [row] = await admin`select * from tasting_moments where id = ${t0}`;
  const { error: again } = await a.db.from("tasting_moments").upsert({ id: t0, strip_id: row.strip_id, moment: "t0", text: row.text, at: row.at });
  expect(again).toBeNull();
  await fails(admin`delete from tasting_moments where id = ${t0}`);
  // Only the opening's text: a family or a curve hangs from a later tab.
  await fails(admin`insert into tasting_curve (moment_id, user_id, segment, level) values (${t0}, ${a.id}, 1, 'mid')`);
  await fails(admin`insert into tasting_moments (strip_id, user_id, moment, text, intensity) values (${made.strip}, ${a.id}, 't15', null, 9)`);
});

it("every choice is a fixed code, checked by the database", async () => {
  await fails(admin`insert into tasting_families (moment_id, user_id, scheme, code) values (${made.t5}, ${a.id}, 'calkin', 'ozonic')`);
  await fails(admin`insert into tasting_families (moment_id, user_id, scheme, code) values (${made.t5}, ${a.id}, 'otra', 'floral')`);
  await fails(admin`insert into tasting_battery (moment_id, user_id, axis, state) values (${made.t5}, ${a.id}, 'metallic', 'no sé')`);
  await fails(admin`insert into tasting_curve (moment_id, user_id, segment, level) values (${made.t5}, ${a.id}, 5, 'mid')`);
  await fails(admin`update tasting_closures set decay = 'se va' where strip_id = ${made.strip}`);
  await fails(admin`update tasting_strips set blind_label = 'E' where id = ${made.strip}`);
  await fails(admin`update tasting_moments set reviewed = '{otra}' where id = ${made.t5}`);
});

it("the comparison waits for the series to close", async () => {
  const strip2 = await a.db.from("tasting_strips").insert({ session_id: made.session, material_id: common, blind_label: "B" }).select("id").single();
  expect(strip2.error).toBeNull();
  const { error } = await a.db.from("tasting_closures").insert({ strip_id: strip2.data!.id, comparison: "demasiado pronto" });
  expect(error?.code).toBe("23514");
  const { error: blank } = await a.db.from("tasting_closures").insert({ strip_id: strip2.data!.id, decay: "fades" });
  expect(blank).toBeNull();
});

it("B sees none of yours, and cannot put a strip in your session or tie one to your dilution", async () => {
  for (const [table, id] of [["tasting_sessions", made.session], ["tasting_strips", made.strip], ["tasting_moments", made.t5]] as const) {
    const { data } = await b.db.from(table).select("id").eq("id", id);
    expect(data, table).toEqual([]);
  }
  const { error } = await b.db.from("tasting_strips").insert({ session_id: made.session, material_id: common, blind_label: "C" });
  // Refused: by the trigger (23514) before the RLS (42501) gets to look; either is a no.
  expect(["23514", "42501"]).toContain(error?.code);
  const own = await b.db.from("tasting_sessions").insert({ note: `${TAG} de B` }).select("id").single();
  const { error: theirs } = await b.db.from("tasting_strips").insert({ session_id: own.data!.id, material_id: common, blind_label: "A", dilution_id: dilution });
  expect(["23514", "42501"]).toContain(theirs?.code);
  const forB = await download(b.token);
  expect(has(forB, "tasting_strips", made.strip)).toBe(false);
  const forA = await downloadWhen(a.token, (s) => has(s, "tasting_closures", [...(s.get("tasting_closures")?.keys() ?? [])][0] ?? ""));
  expect(has(forA, "tasting_strips", made.strip)).toBe(true);
  expect(forA.get("tasting_strips")?.get(made.strip)?.fraction).toBe("0.1");
});

it("a session goes with everything it holds, the opening too", async () => {
  const { error } = await a.db.from("tasting_sessions").delete().eq("id", made.session);
  expect(error).toBeNull();
  expect(await admin`select id from tasting_moments where strip_id = ${made.strip}`).toEqual([]);
  expect(await admin`select id from tasting_strips where session_id = ${made.session}`).toEqual([]);
});
