import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, downloadWhen, has, signIn, type TestUser } from "./local";

/**
 * Your shopping list (V3-79) with two users: only yours, of a material you can see, from a formula
 * of yours; it comes down through the sync to you and never to the other.
 */

const TAG = "[prueba compra]";
let a: TestUser;
let b: TestUser;
let common: string;
let bsMaterial: string;
let bsFormula: string;

async function insertAs(user: TestUser, row: Record<string, unknown>): Promise<{ id?: string; code?: string }> {
  const { data, error } = await user.db.from("shopping_items").insert(row).select("id").maybeSingle();
  return error ? { code: error.code } : { id: data?.id };
}

beforeAll(async () => {
  await admin`delete from shopping_items where note like ${TAG + "%"}`;
  await admin`delete from formulas where name like ${TAG + "%"}`;
  await admin`delete from workbenches where name like ${TAG + "%"}`;
  await admin`delete from materials where name like ${TAG + "%"}`;
  [a, b] = await Promise.all([signIn("A"), signIn("B")]);
  [{ id: common }] = await admin`insert into materials (name, kind) values (${`${TAG} cacao`}, 'natural') returning id`;
  [{ id: bsMaterial }] = await admin`insert into materials (name, kind, owner_id) values (${`${TAG} B's`}, 'composition', ${b.id}) returning id`;
  const [{ id: bench }] = await admin`insert into workbenches (name, owner_id) values (${`${TAG} B's bench`}, ${b.id}) returning id`;
  [{ id: bsFormula }] = await admin`insert into formulas (name, workbench_id, owner_id) values (${`${TAG} B's formula`}, ${bench}, ${b.id}) returning id`;
});

afterAll(async () => {
  await admin`delete from shopping_items where note like ${TAG + "%"}`;
  await admin`delete from formulas where name like ${TAG + "%"}`;
  await admin`delete from workbenches where name like ${TAG + "%"}`;
  await admin`delete from materials where name like ${TAG + "%"}`;
  await admin.end();
});

describe("the shopping list is yours (V3-79)", () => {
  it("A writes down a common material and it comes down to A, not to B", async () => {
    const { id } = await insertAs(a, { user_id: a.id, material_id: common, shop: "Maese Lab", note: `${TAG} 1` });
    expect(id).toBeTruthy();
    const mine = await downloadWhen(a.token, (s) => has(s, "shopping_items", id!));
    expect(mine.get("shopping_items")?.get(id!)?.shop).toBe("Maese Lab");
    const { data } = await b.db.from("shopping_items").select("id").eq("id", id!);
    expect(data).toEqual([]);
  });

  it("refuses a line for B, of B's material, or from a formula that is not A's", async () => {
    expect((await insertAs(a, { user_id: b.id, material_id: common, note: `${TAG} 2` })).code).toBe("42501");
    expect((await insertAs(a, { user_id: a.id, material_id: bsMaterial, note: `${TAG} 3` })).code).toBe("42501");
    expect((await insertAs(a, { user_id: a.id, material_id: common, formula_id: bsFormula, note: `${TAG} 4` })).code).toBe("42501");
  });
});
