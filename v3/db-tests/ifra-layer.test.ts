import { afterAll, beforeAll, expect, it } from "vitest";
import { admin, downloadWhen, has, signIn, type TestUser } from "./local";

/**
 * Plan v3, step 4.2 (V3-35): IFRA's layer, apart from the materials. Whoever signs in reads it;
 * nobody writes it but the loading script; its figures keep their scale; and it reaches the
 * browser down its own stream.
 */

const CODE = "IFRA_STD_PRUEBA_42";
let a: TestUser;
let b: TestUser;
let standard: string;
let limit: string;
let annex: string;

const cleanUp = async () => {
  await admin`delete from ifra_standards where code = ${CODE}`;
  await admin`delete from ifra_annex where natural_name = ${CODE}`;
};

beforeAll(async () => {
  await cleanUp();
  [a, b] = await Promise.all([signIn("A"), signIn("B")]);
  [{ id: standard }] = await admin`insert into ifra_standards (code, name, amendment, type, restriction, group_key)
                                   values (${CODE}, 'Prueba', '51', 'RESTRICTION', true, ${CODE}) returning id`;
  [{ id: limit }] = await admin`insert into ifra_limits (standard_id, category, kind, max_value) values (${standard}, '4', 'max', 0.000013) returning id`;
  await admin`insert into ifra_substances (standard_id, cas) values (${standard}, '78-59-1')`;
  [{ id: annex }] = await admin`insert into ifra_annex (amendment, natural_cas, natural_name, constituent_cas, constituent_name, concentration)
                                values ('51', '8016-26-0', ${CODE}, '78-59-1', 'Isophorone', 0.0001) returning id`;
});

afterAll(async () => {
  await cleanUp();
  await admin.end();
});

it("whoever signs in reads the layer, and nobody writes it", async () => {
  const { data } = await a.db.from("ifra_limits").select("max_value").eq("id", limit);
  expect(data).toEqual([{ max_value: 0.000013 }]);
  const { error: insert } = await a.db.from("ifra_limits").insert({ standard_id: standard, category: "5A", kind: "prohibited" });
  expect(insert?.code).toBe("42501");
  const { data: changed } = await b.db.from("ifra_limits").update({ max_value: "1" }).eq("id", limit).select("id");
  expect(changed).toEqual([]);
  const [still] = await admin`select max_value::text as max_value from ifra_limits where id = ${limit}`;
  expect(still.max_value).toBe("0.000013");
});

it("a limit is a fraction in (0, 1] or a prohibition without a figure; the annex, a fraction", async () => {
  const fails = (query: Promise<unknown>) => expect(query).rejects.toMatchObject({ code: "23514" });
  await fails(admin`insert into ifra_limits (standard_id, category, kind, max_value) values (${standard}, '5A', 'max', 0)`);
  await fails(admin`insert into ifra_limits (standard_id, category, kind, max_value) values (${standard}, '5B', 'max', 1.5)`);
  await fails(admin`insert into ifra_limits (standard_id, category, kind, max_value) values (${standard}, '5C', 'prohibited', 0.1)`);
  await fails(admin`insert into ifra_limits (standard_id, category, kind) values (${standard}, '5D', 'lots')`);
  await fails(admin`insert into ifra_annex (amendment, natural_cas, natural_name, constituent_name, concentration)
                    values ('51', '1-1-1', ${CODE}, 'x', 2)`);
});

it("it comes down its own stream, exact, to whoever signs in", async () => {
  for (const user of [a, b]) {
    const synced = await downloadWhen(user.token, (s) => has(s, "ifra_limits", limit) && has(s, "ifra_annex", annex));
    expect(has(synced, "ifra_standards", standard)).toBe(true);
    expect(synced.get("ifra_limits")?.get(limit)?.max_value).toBe("0.000013");
  }
});
