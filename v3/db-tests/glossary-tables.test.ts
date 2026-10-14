import { afterAll, beforeAll, expect, it } from "vitest";
import { admin, download, downloadWhen, has, signIn, type TestUser } from "./local";

/**
 * Plan v3, step 4.2 (V3-36): the glossary's lists, descriptors, relations and reference
 * perfumes, as the doses. Each row is read with its material and written only in one's own;
 * its owner is its material's, whatever the writer sends; a common material relates only to
 * common ones; and each list reaches through the sync whom it should, and nobody else.
 */

const TAG = "[prueba 4.2 listas]";
const LISTS = ["material_descriptors", "material_relations", "material_references"] as const;
let a: TestUser;
let b: TestUser;
let common: string;
let commonOther: string;
let aOwn: string;

/** A user's insert, as the app would send it: returns the new id, or the error code. */
async function insertAs(user: TestUser, table: string, row: Record<string, unknown>): Promise<{ id?: string; code?: string }> {
  const { data, error } = await user.db.from(table).insert(row).select("id").maybeSingle();
  return error ? { code: error.code } : { id: data?.id };
}

/** One row of each list for a material, as its writer would send it. */
const rowsFor = (material: string, other: string) => ({
  material_descriptors: { material_id: material, source: "TG", text: "verde, herbal" },
  material_relations: { material_id: material, kind: "combines", other_id: other, note: "prueba", sources: "web" },
  material_references: { material_id: material, perfume: "Eau Sauvage", house: "Dior", sources: "web" },
});

const cleanUp = () => admin`delete from materials where name like ${TAG + "%"}`;

beforeAll(async () => {
  await cleanUp();
  [a, b] = await Promise.all([signIn("A"), signIn("B")]);
  [{ id: common }] = await admin`insert into materials (name, kind) values (${`${TAG} Lavender oil`}, 'natural') returning id`;
  [{ id: commonOther }] = await admin`insert into materials (name, kind) values (${`${TAG} Coumarin`}, 'molecule') returning id`;
  aOwn = (await insertAs(a, "materials", { name: `${TAG} A's lavender`, kind: "natural", owner_id: a.id, based_on_id: common })).id!;
});

afterAll(async () => {
  await cleanUp();
  await admin.end();
});

it("the loading script writes the common lists; a user cannot", async () => {
  for (const [table, row] of Object.entries(rowsFor(common, commonOther))) {
    await admin`insert into ${admin(table)} ${admin(row)}`;
    expect((await insertAs(a, table, row)).code, table).toBe("42501");
  }
});

it("a user writes the lists of their own material; its owner is the material's, whatever is sent", async () => {
  for (const [table, row] of Object.entries(rowsFor(aOwn, common))) {
    const { id, code } = await insertAs(a, table, { ...row, owner_id: b.id });
    expect(code, table).toBeUndefined();
    const [stored] = await admin`select owner_id from ${admin(table)} where id = ${id!}`;
    expect(stored.owner_id, table).toBe(a.id);
  }
});

it("B neither reads nor writes A's lists", async () => {
  for (const table of LISTS) {
    const { data } = await b.db.from(table).select("id").eq("material_id", aOwn);
    expect(data, table).toEqual([]);
  }
  for (const [table, row] of Object.entries(rowsFor(aOwn, common))) {
    expect((await insertAs(b, table, row)).code, table).toBe("42501");
  }
});

it("a common material relates only to common ones", async () => {
  await expect(
    admin`insert into material_relations (material_id, kind, other_id) values (${common}, 'substitute', ${aOwn})`,
  ).rejects.toMatchObject({ code: "23514" });
  // Without a material in the glossary, the other one is only a name; and a relation needs one or the other.
  await admin`insert into material_relations (material_id, kind, other_text) values (${common}, 'clashes', 'vainillina')`;
  await expect(admin`insert into material_relations (material_id, kind) values (${common}, 'clashes')`).rejects.toMatchObject({ code: "23514" });
});

it("through the sync: A gets the common lists and its own; B, the common ones and never A's", async () => {
  const ownOf = async (table: string, material: string) => (await admin`select id from ${admin(table)} where material_id = ${material}`).map((r) => r.id as string);
  const commonIds = Object.fromEntries(await Promise.all(LISTS.map(async (t) => [t, await ownOf(t, common)] as const)));
  const aIds = Object.fromEntries(await Promise.all(LISTS.map(async (t) => [t, await ownOf(t, aOwn)] as const)));
  const forA = await downloadWhen(a.token, (s) => LISTS.every((t) => aIds[t].every((id) => has(s, t, id))));
  const forB = await download(b.token);
  for (const table of LISTS) {
    for (const id of commonIds[table]) {
      expect(has(forA, table, id), `${table}: A, común`).toBe(true);
      expect(has(forB, table, id), `${table}: B, común`).toBe(true);
    }
    for (const id of aIds[table]) {
      expect(has(forA, table, id), `${table}: A, suya`).toBe(true);
      expect(has(forB, table, id), `${table}: B, de A`).toBe(false);
    }
  }
});
