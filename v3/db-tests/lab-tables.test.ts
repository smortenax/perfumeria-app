import { afterAll, beforeAll, expect, it } from "vitest";
import { admin, download, downloadWhen, has, signIn, type TestUser } from "./local";

/**
 * Plan v3, step 4.2 (V3-36): your lab, the dilutions you made, your tasting and your axes, as
 * «what I have»: only yours, written by you about a material you can see, never seen by
 * anyone else, not even through the sync; each with its scale.
 */

const TAG = "[prueba 4.2 lab]";
let a: TestUser;
let b: TestUser;
let common: string;

async function insertAs(user: TestUser, table: string, row: Record<string, unknown>): Promise<{ id?: string; code?: string }> {
  const { data, error } = await user.db.from(table).insert(row).select("id").maybeSingle();
  return error ? { code: error.code } : { id: data?.id };
}

const cleanUp = () => admin`delete from materials where name like ${TAG + "%"}`;
const ids: Record<string, string> = {};

beforeAll(async () => {
  await cleanUp();
  [a, b] = await Promise.all([signIn("A"), signIn("B")]);
  [{ id: common }] = await admin`insert into materials (name, kind) values (${`${TAG} Hedione`}, 'molecule') returning id`;
});

afterAll(async () => {
  await cleanUp();
  await admin.end();
});

it("you write your dilution and your axis; they are yours, whoever you say", async () => {
  const rows = {
    lab_dilutions: { material_id: common, fraction: "0.1", solvent: "DPG", made_on: "2026-10-14", description: "frasco de trabajo" },
    lab_axes: { material_id: common, axis: "floral" },
  };
  for (const [table, row] of Object.entries(rows)) {
    const { id, code } = await insertAs(a, table, row);
    expect(code, table).toBeUndefined();
    ids[table] = id!;
    const [stored] = await admin`select user_id from ${admin(table)} where id = ${id!}`;
    expect(stored.user_id, table).toBe(a.id);
    expect((await insertAs(a, table, { ...row, user_id: b.id })).code, `${table}, para B`).toBe("42501");
  }
});

// V3-60: the lab's tasting is the legacy, read only; the new tastings are tasting_* (db-tests/tastings.test.ts).
it("your lab's tasting is yours to read, never to write: only the loading script writes it", async () => {
  [{ id: ids.lab_evaluations }] = await admin`
    insert into lab_evaluations (user_id, material_id, status, reading) values (${a.id}, ${common}, 'catado', 'jazmín transparente') returning id`;
  const { data } = await a.db.from("lab_evaluations").select("reading").eq("id", ids.lab_evaluations);
  expect(data).toEqual([{ reading: "jazmín transparente" }]);
  expect((await insertAs(a, "lab_evaluations", { material_id: common, status: "catado" })).code).toBe("42501");
  const { data: changed } = await a.db.from("lab_evaluations").update({ reading: "otra" }).eq("id", ids.lab_evaluations).select("id");
  expect(changed).toEqual([]);
  await a.db.from("lab_evaluations").delete().eq("id", ids.lab_evaluations);
  const [still] = await admin`select reading from lab_evaluations where id = ${ids.lab_evaluations}`;
  expect(still.reading).toBe("jazmín transparente");
});

it("B sees none of yours", async () => {
  for (const table of Object.keys(ids)) {
    const { data } = await b.db.from(table).select("id").eq("id", ids[table]);
    expect(data, table).toEqual([]);
  }
});

it("each keeps its scale: a dilution in (0, 1], a date as a date, one tasting per material, an axis with a name", async () => {
  const fails = (query: Promise<unknown>, code = "23514") => expect(query).rejects.toMatchObject({ code });
  await fails(admin`insert into lab_dilutions (user_id, material_id, fraction) values (${a.id}, ${common}, 0)`);
  await fails(admin`insert into lab_dilutions (user_id, material_id, fraction) values (${a.id}, ${common}, 1.5)`);
  await fails(admin`insert into lab_dilutions (user_id, material_id, fraction, made_on) values (${a.id}, ${common}, 0.5, '14/10/2026')`);
  await fails(admin`insert into lab_evaluations (user_id, material_id, status) values (${a.id}, ${common}, 'otra')`, "23505");
  await fails(admin`insert into lab_axes (user_id, material_id, axis) values (${a.id}, ${common}, ' ')`);
});

it("through the sync, they reach you, exact, and never B", async () => {
  const forA = await downloadWhen(a.token, (s) => Object.entries(ids).every(([table, id]) => has(s, table, id)));
  const forB = await download(b.token);
  for (const [table, id] of Object.entries(ids)) {
    expect(has(forA, table, id), `${table}: tú`).toBe(true);
    expect(has(forB, table, id), `${table}: B`).toBe(false);
  }
  expect(forA.get("lab_dilutions")?.get(ids.lab_dilutions)?.fraction).toBe("0.1");
});
