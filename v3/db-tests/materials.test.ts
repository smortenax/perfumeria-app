import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, download, downloadWhen, has, signIn, type TestUser } from "./local";

/**
 * Plan v3, step 2.8: the materials' tables with two users. Done when A sees nothing of B's,
 * not even through the sync; A does not write in the common data; and A's version of a common
 * material does not change the common one. Also the triggers of step 2.7.
 */

const TAG = "[prueba 2.8]";
let a: TestUser;
let b: TestUser;
let commonMolecule: string;
let commonNatural: string;

/** Removes the test's materials, the ones nothing else points to first. */
async function cleanUp(): Promise<void> {
  for (let round = 0; round < 10; round++) {
    const gone = await admin`
      delete from materials
      where name like ${TAG + "%"}
        and id not in (select component_id from material_components)
        and id not in (select based_on_id from materials where based_on_id is not null)
      returning id`;
    if (gone.length === 0) return;
  }
}

async function insertCommon(name: string, kind: string): Promise<string> {
  const [row] = await admin`insert into materials (name, kind) values (${`${TAG} ${name}`}, ${kind}) returning id`;
  return row.id;
}

/** A user's insert, as the app would send it: returns the new id, or the error code. */
async function insertAs(user: TestUser, table: string, row: Record<string, unknown>): Promise<{ id?: string; code?: string }> {
  const { data, error } = await user.db.from(table).insert(row).select("id").maybeSingle();
  return error ? { code: error.code } : { id: data?.id };
}

/** Refused: by RLS (42501) or, first, by a trigger of step 2.7 (23514), which Postgres runs before the policy's check. */
const REFUSED = ["42501", "23514"];

const snapshot = async (id: string) => ({
  material: await admin`select * from materials where id = ${id}`,
  components: await admin`select * from material_components where material_id = ${id} order by id`,
  regulations: await admin`select * from regulations where material_id = ${id} order by id`,
});

beforeAll(async () => {
  await cleanUp();
  [a, b] = await Promise.all([signIn("A"), signIn("B")]);
  commonMolecule = await insertCommon("Linalool", "molecule");
  commonNatural = await insertCommon("Lavender oil", "natural");
  await admin`insert into material_components (material_id, component_id, amount_kind, value, authority, source)
              values (${commonNatural}, ${commonMolecule}, 'max', 0.45, 'ifra', 'IFRA 51, anexo (prueba)')`;
  await admin`insert into regulations (material_id, regime, category, kind, max_value, authority, source)
              values (${commonMolecule}, 'ifra', '4', 'max', 0.02, 'ifra', 'IFRA 51 (prueba)')`;
});

afterAll(async () => {
  await cleanUp();
  await admin.end();
});

describe("A sees nothing of B's", () => {
  let bMaterial: string;
  let bRows: Record<string, string>;
  let aMaterial: string;

  beforeAll(async () => {
    bMaterial = (await insertAs(b, "materials", { name: `${TAG} B's base`, kind: "composition", owner_id: b.id })).id!;
    aMaterial = (await insertAs(a, "materials", { name: `${TAG} A's base`, kind: "composition", owner_id: a.id })).id!;
    bRows = {
      material_components: (await insertAs(b, "material_components", {
        material_id: bMaterial, component_id: commonMolecule, amount_kind: "exact", value: "0.3", authority: "product", source: "prueba",
      })).id!,
      regulations: (await insertAs(b, "regulations", {
        material_id: bMaterial, regime: "manufacturer", kind: "max", max_value: "0.05", authority: "product", source: "prueba",
      })).id!,
      material_doses: (await insertAs(b, "material_doses", {
        material_id: bMaterial, typical: "0.02", basis: "concentrate", authority: "literature", source: "prueba",
      })).id!,
      lab_materials: (await insertAs(b, "lab_materials", { material_id: bMaterial })).id!,
    };
    expect(bMaterial && aMaterial && Object.values(bRows).every(Boolean)).toBeTruthy();
  });

  it("not in the database: no material, component, regulation, dose or mark of B's", async () => {
    expect((await a.db.from("materials").select("id").eq("id", bMaterial)).data).toEqual([]);
    for (const [table, id] of Object.entries(bRows)) {
      expect((await a.db.from(table).select("id").eq("id", id)).data, table).toEqual([]);
    }
  });

  it("and A cannot change or delete B's material", async () => {
    expect((await a.db.from("materials").update({ name: "cambiado por A" }).eq("id", bMaterial).select("id")).data).toEqual([]);
    expect((await a.db.from("materials").delete().eq("id", bMaterial).select("id")).data).toEqual([]);
    const [still] = await admin`select name from materials where id = ${bMaterial}`;
    expect(still.name).toBe(`${TAG} B's base`);
  });

  it("nor through the sync: A gets the common rows and its own, never B's", async () => {
    const aSynced = await downloadWhen(a.token, (s) => has(s, "materials", aMaterial) && has(s, "materials", commonNatural));
    expect(has(aSynced, "materials", aMaterial)).toBe(true);
    expect(has(aSynced, "materials", commonMolecule)).toBe(true);
    expect(has(aSynced, "materials", commonNatural)).toBe(true);
    expect(has(aSynced, "materials", bMaterial)).toBe(false);
    for (const [table, id] of Object.entries(bRows)) {
      expect(has(aSynced, table, id), table).toBe(false);
    }
    const bSynced = await downloadWhen(b.token, (s) => has(s, "materials", bMaterial));
    expect(has(bSynced, "materials", bMaterial)).toBe(true);
    expect(has(bSynced, "material_components", bRows.material_components)).toBe(true);
    expect(has(bSynced, "materials", aMaterial)).toBe(false);
  });

  it("and A cannot use B's material in its own", async () => {
    const result = await insertAs(a, "material_components", {
      material_id: aMaterial, component_id: bMaterial, amount_kind: "unknown", authority: "consensus", source: "prueba",
    });
    expect(REFUSED).toContain(result.code);
  });
});

describe("A does not write in the common data", () => {
  it("cannot create a common material, nor one for B", async () => {
    expect((await insertAs(a, "materials", { name: `${TAG} common by A`, kind: "molecule", owner_id: null })).code).toBe("42501");
    expect((await insertAs(a, "materials", { name: `${TAG} B's by A`, kind: "molecule", owner_id: b.id })).code).toBe("42501");
  });

  it("cannot change or delete a common material", async () => {
    const before = await snapshot(commonMolecule);
    expect((await a.db.from("materials").update({ name: "cambiado por A" }).eq("id", commonMolecule).select("id")).data).toEqual([]);
    expect((await a.db.from("materials").delete().eq("id", commonMolecule).select("id")).data).toEqual([]);
    expect((await a.db.from("regulations").update({ max_value: "1" }).eq("material_id", commonMolecule).select("id")).data).toEqual([]);
    expect(await snapshot(commonMolecule)).toEqual(before);
  });

  it("cannot add to a common material's composition, regulations or doses, nor create a category", async () => {
    expect((await insertAs(a, "material_components", {
      material_id: commonNatural, component_id: commonMolecule, amount_kind: "exact", value: "0.9", authority: "lot", source: "prueba",
    })).code).toBe("42501");
    expect((await insertAs(a, "regulations", {
      material_id: commonNatural, regime: "manufacturer", kind: "max", max_value: "0.5", authority: "product", source: "prueba",
    })).code).toBe("42501");
    expect((await insertAs(a, "material_doses", {
      material_id: commonNatural, typical: "0.1", basis: "concentrate", authority: "literature", source: "prueba",
    })).code).toBe("42501");
    expect((await insertAs(a, "material_categories", { name: `${TAG} category by A` })).code).toBe("42501");
  });
});

describe("A's version of a common material does not change the common one (V3-5)", () => {
  it("A adds its own composition and limit; the common material, its composition and its regulations stay as they were", async () => {
    const before = await snapshot(commonNatural);
    const version = (await insertAs(a, "materials", {
      name: `${TAG} A's lavender`, kind: "natural", owner_id: a.id, based_on_id: commonNatural, supplier: "Maese Lab",
    })).id!;
    expect(version).toBeTruthy();
    expect((await insertAs(a, "material_components", {
      material_id: version, component_id: commonMolecule, amount_kind: "exact", value: "0.38", authority: "lot", source: "certificado (prueba)",
    })).id).toBeTruthy();
    expect((await insertAs(a, "regulations", {
      material_id: version, regime: "manufacturer", kind: "max", max_value: "0.1", authority: "product", source: "ficha (prueba)",
    })).id).toBeTruthy();
    expect(await snapshot(commonNatural)).toEqual(before);
  });

  it("A cannot base a material on B's", async () => {
    const bOwn = (await insertAs(b, "materials", { name: `${TAG} B's own`, kind: "natural", owner_id: b.id })).id!;
    expect(REFUSED).toContain((await insertAs(a, "materials", { name: `${TAG} on B's`, kind: "natural", owner_id: a.id, based_on_id: bOwn })).code);
  });
});

describe("the triggers of step 2.7, whoever writes (here, as the loading script)", () => {
  const fails = async (query: Promise<unknown>) => expect(query).rejects.toMatchObject({ code: "23514" });

  it("a common material contains only common materials", async () => {
    const [own] = await admin`insert into materials (name, kind, owner_id) values (${`${TAG} A's`}, 'molecule', ${a.id}) returning id`;
    await fails(admin`insert into material_components (material_id, component_id, amount_kind, authority, source)
                      values (${commonNatural}, ${own.id}, 'unknown', 'consensus', 'prueba')`);
  });

  it("no material contains itself, even through others", async () => {
    const x = await insertCommon("X", "composition");
    const y = await insertCommon("Y", "composition");
    await admin`insert into material_components (material_id, component_id, amount_kind, authority, source) values (${x}, ${y}, 'unknown', 'consensus', 'prueba')`;
    await fails(admin`insert into material_components (material_id, component_id, amount_kind, authority, source) values (${y}, ${x}, 'unknown', 'consensus', 'prueba')`);
  });

  it("no chain of «based on» comes back to itself, and a common one is based only on a common one", async () => {
    const p = await insertCommon("P", "natural");
    const q = await insertCommon("Q", "natural");
    await admin`update materials set based_on_id = ${p} where id = ${q}`;
    await fails(admin`update materials set based_on_id = ${q} where id = ${p}`);
    const [own] = await admin`insert into materials (name, kind, owner_id) values (${`${TAG} A's base of a common`}, 'natural', ${a.id}) returning id`;
    await fails(admin`update materials set based_on_id = ${own.id} where id = ${p}`);
  });

  it("the owner of a material does not change", async () => {
    const [own] = await admin`insert into materials (name, kind, owner_id) values (${`${TAG} A's to give away`}, 'molecule', ${a.id}) returning id`;
    await fails(admin`update materials set owner_id = ${b.id} where id = ${own.id}`);
    await fails(admin`update materials set owner_id = null where id = ${own.id}`);
  });

  it("the composition of a frozen formula is not changed; the formula can still be deleted", async () => {
    const [frozen] = await admin`insert into materials (name, kind, owner_id) values (${`${TAG} A's frozen accord`}, 'frozen', ${a.id}) returning id`;
    const [row] = await admin`insert into material_components (material_id, component_id, amount_kind, value, authority, source)
                              values (${frozen.id}, ${commonMolecule}, 'exact', 0.25, 'lot', 'fórmula (prueba)') returning id`;
    await fails(admin`update material_components set value = 0.5 where id = ${row.id}`);
    await fails(admin`delete from material_components where id = ${row.id}`);
    await fails(admin`update materials set kind = 'composition' where id = ${frozen.id}`);
    await admin`delete from materials where id = ${frozen.id}`;
    expect(await admin`select id from material_components where id = ${row.id}`).toHaveLength(0);
  });

  it("the composition, regulations and doses carry their material's owner, whatever the writer sends", async () => {
    const [row] = await admin`insert into regulations (material_id, regime, kind, max_value, authority, source, owner_id)
                              values (${commonMolecule}, 'manufacturer', 'max', 0.3, 'product', 'prueba', ${a.id}) returning owner_id`;
    expect(row.owner_id).toBeNull();
  });

  it("updated_at follows the last change", async () => {
    const [before] = await admin`select updated_at from materials where id = ${commonMolecule}`;
    await admin`update materials set aliases = '{LIN}' where id = ${commonMolecule}`;
    const [after] = await admin`select updated_at from materials where id = ${commonMolecule}`;
    expect(after.updated_at.getTime()).toBeGreaterThan(before.updated_at.getTime());
  });
});

describe("what reaches the browser keeps every figure exact (V3-9)", () => {
  it("a numeric comes down through the sync as the same text, without going through a float", async () => {
    const exact = "0.123456789012345678901234567891";
    const [row] = await admin`insert into materials (name, kind, purity) values (${`${TAG} exact`}, 'molecule', ${exact}) returning id`;
    const synced = await downloadWhen(a.token, (s) => has(s, "materials", row.id));
    expect(synced.get("materials")?.get(row.id)?.purity).toBe(exact);
  });
});

it("PowerSync answers for both users", async () => {
  expect((await download(a.token)).size).toBeGreaterThan(0);
  expect((await download(b.token)).size).toBeGreaterThan(0);
});
