import { randomUUID } from "node:crypto";
import type postgres from "postgres";
import { afterAll, expect, it } from "vitest";
import { admin } from "./local";

/**
 * The common side of the new materials' system (V3-70; docs-v3/sistema-materiales.md): every
 * signed-in user reads it and nobody writes it; one star per material, product and attribute;
 * the identity key checked at commit; a list claim's terms of the attribute's list; each type of
 * material with its own columns; and the resolved sheet. Each test leaves nothing behind: its
 * rows are written in a transaction that is undone at the end, except the one that must commit.
 */

class Undo extends Error {}
type Tx = postgres.TransactionSql;

/** A source, a vocabulary term, an attribute and a pure material on a new substance, inside tx. */
async function fixture(tx: Tx) {
  const cas = `${Math.floor(1000000 + Math.random() * 8999999)}-00-0`;
  const ids: Record<"source" | "form" | "attribute" | "family" | "substance" | "material", string> = { source: randomUUID(), form: randomUUID(), attribute: randomUUID(), family: randomUUID(), substance: randomUUID(), material: randomUUID() };
  await tx`insert into common.sources (id, name, kind) values (${ids.source}, ${`prueba ${ids.source}`}, 'web')`;
  await tx`insert into common.vocabularies (id, list, code, name) values (${ids.form}, 'isomeric_form', ${`p-${ids.form}`}, 'prueba')`;
  await tx`insert into common.vocabularies (id, list, code, name) values (${ids.family}, 'family', ${`p-${ids.family}`}, 'prueba')`;
  // The sheet reads its main family from the attribute «families»: the loaded one, or one for the test.
  await tx`insert into common.attributes (id, code, name, "group", value_type, is_list, vocabulary_list)
           values (${ids.attribute}, 'families', 'familias con %', 'olfactory', 'list', true, 'family') on conflict (code) do nothing`;
  const [attribute] = await tx`select id from common.attributes where code = 'families'`;
  ids.attribute = attribute.id as string;
  await tx`insert into common.substances (id, cas, name) values (${ids.substance}, ${cas}, 'prueba')`;
  await tx`insert into common.materials (id, name, type, substance_id, isomeric_form_id, identity_key)
           values (${ids.material}, 'prueba', 'pure', ${ids.substance}, ${ids.form}, ${`pure:${cas}:p-${ids.form}`})`;
  return { ...ids, cas };
}

/** Runs body in a transaction and undoes it. */
const undone = (body: (tx: Tx) => Promise<void>) =>
  admin
    .begin(async (tx) => {
      await body(tx);
      throw new Undo();
    })
    .catch((e) => {
      if (!(e instanceof Undo)) throw e;
    });

afterAll(async () => {
  await admin.end();
});

it("a signed-in user reads the common side and writes none of it", async () => {
  await undone(async (tx) => {
    const f = await fixture(tx);
    await tx`select set_config('request.jwt.claim.sub', ${randomUUID()}, true)`;
    await tx`set local role authenticated`;
    const [{ n }] = await tx`select count(*)::int as n from common.materials where id = ${f.material}`;
    expect(n).toBe(1);
    await tx`savepoint s`;
    await expect(tx`update common.materials set name = 'otro' where id = ${f.material}`).rejects.toMatchObject({ code: "42501" });
    await tx`rollback to savepoint s`;
    await expect(tx`insert into common.sources (id, name, kind) values (${randomUUID()}, 'x', 'web')`).rejects.toMatchObject({ code: "42501" });
  });
});

it("one star per material, product and attribute, also when there is no product", async () => {
  await undone(async (tx) => {
    const f = await fixture(tx);
    const star = (id: string) =>
      tx`insert into common.claims (id, material_id, attribute_id, source_id, rank) values (${id}, ${f.material}, ${f.attribute}, ${f.source}, 'star')`;
    await star(randomUUID());
    await expect(star(randomUUID())).rejects.toMatchObject({ code: "23505", constraint_name: "claims_one_star" });
  });
});

it("a list claim takes terms of its attribute's list only", async () => {
  await undone(async (tx) => {
    const f = await fixture(tx);
    const claim = randomUUID();
    await tx`insert into common.claims (id, material_id, attribute_id, source_id) values (${claim}, ${f.material}, ${f.attribute}, ${f.source})`;
    await tx`insert into common.claim_terms (id, claim_id, list, vocabulary_id, percentage) values (${randomUUID()}, ${claim}, 'family', ${f.family}, 0.5)`;
    await expect(
      tx`insert into common.claim_terms (id, claim_id, list, vocabulary_id) values (${randomUUID()}, ${claim}, 'isomeric_form', ${f.form})`,
    ).rejects.toMatchObject({ code: "23514" });
  });
});

it("each type keeps its own columns: a pure material has no species", async () => {
  await undone(async (tx) => {
    const f = await fixture(tx);
    await expect(tx`update common.materials set species = 'Salvia sclarea' where id = ${f.material}`).rejects.toMatchObject({
      code: "23514",
      constraint_name: "materials_by_type",
    });
  });
});

it("the identity key is checked when the transaction ends", async () => {
  let material = "";
  await expect(
    admin.begin(async (tx) => {
      const f = await fixture(tx);
      material = f.material;
      await tx`update common.materials set identity_key = 'pure:otra' where id = ${f.material}`;
    }),
  ).rejects.toMatchObject({ code: "23514" });
  const left = await admin`select 1 from common.materials where id = ${material}`;
  expect(left).toHaveLength(0);
});

it("the sheet: a pure material is its substance, whole, and its family is the starred one", async () => {
  await undone(async (tx) => {
    const f = await fixture(tx);
    const claim = randomUUID();
    await tx`insert into common.claims (id, material_id, attribute_id, source_id, rank) values (${claim}, ${f.material}, ${f.attribute}, ${f.source}, 'star')`;
    await tx`insert into common.claim_terms (id, claim_id, list, vocabulary_id, percentage) values (${randomUUID()}, ${claim}, 'family', ${f.family}, 1)`;
    await tx`select common.refresh_sheets()`;
    const [sheet] = await tx`select id, family_id, values from common.sheets where material_id = ${f.material} and product_id is null`;
    expect(sheet.id).toBe(f.material);
    expect(sheet.family_id).toBe(f.family);
    const lines = await tx`select substance_id, value::text as value, authority from common.sheet_composition where sheet_id = ${sheet.id}`;
    expect(lines).toEqual([{ substance_id: f.substance, value: "1", authority: "identity" }]);
  });
});
