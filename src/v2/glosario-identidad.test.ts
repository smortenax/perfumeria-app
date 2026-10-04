import { describe, expect, it } from "vitest";
import rulesText from "../../docs/v2/estandares-naturales.csv?raw";
import { parseCsv } from "../data/csv.ts";
import { IFRA_FILES, v2Dataset } from "./data";
import { buildIfra, v2Key } from "./to-ifra";

/**
 * «No lo dice» is not an identity (D14, D10): a natural of the glossary is its term, and a species, a part or a process it does not say
 * is never paired with one that a rule of D10 names, nor merged with another natural that does not say it either. And with no process
 * said, no specification is excluded by process: it counts as the worst case.
 */
const table = (text: string) => {
  const [header = [], ...rows] = parseCsv(text.replace(/^﻿/, ""));
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
};
const members = import.meta.glob<string>("../../datos/v2/grupo-miembros.csv", { query: "?raw", import: "default", eager: true });

const data = v2Dataset();
const made = new Map(data.ids.filter((e) => e.entity === "material" && e.key.startsWith("glosario-natural-")).map((e) => [e.id, e.key]));
const naturals = data.materials.filter((m) => made.has(m.id));
const silent = (v: string) => v === "" || v === "no lo dice";

describe("«no lo dice» is not an identity (D14)", () => {
  it("naturals with the same species, part and process, some of them «no lo dice», are still distinct materials, each keyed by its own term", () => {
    const byTriple = new Map<string, typeof naturals>();
    for (const m of naturals.filter((x) => silent(x.species) || silent(x.part) || silent(x.process))) {
      const key = [m.species, m.part, m.process].map((v) => v || "no lo dice").join("|");
      byTriple.set(key, [...(byTriple.get(key) ?? []), m]);
    }
    const shared = [...byTriple.values()].filter((g) => g.length > 2);
    expect(shared.length).toBeGreaterThan(0);
    for (const group of shared) {
      expect(new Set(group.map((m) => m.id)).size).toBe(group.length);
      expect(new Set(group.map((m) => made.get(m.id))).size).toBe(group.length);
      expect(new Set(group.map((m) => m.name.toLowerCase())).size).toBe(group.length);
    }
    for (const m of naturals) {
      expect(made.get(m.id), m.name).toMatch(/^glosario-natural-[a-z]+-/);
      expect(data.v1Links.filter((l) => l.v2Id === m.id).length, m.name).toBeGreaterThan(0);
    }
  });

  it("the rules of D10 name a species, a part and a process, never «no lo dice» or nothing", () => {
    for (const rule of table(rulesText)) {
      for (const field of ["especies", "partes", "procesos"]) {
        const values = rule[field]!.split(";").map((x) => x.trim().toLowerCase());
        expect(values.every((v) => v !== "" && v !== "no lo dice"), `${rule["estandar"]} ${field}`).toBe(true);
      }
    }
  });

  it("no natural that does not say its species, part or process is a member of a standard by identity", () => {
    const rows = table(Object.values(members)[0]!);
    const byIdentity = new Set(rows.filter((r) => r["notas"]!.startsWith("por especie, parte y proceso")).map((r) => r["id_miembro"]));
    for (const m of naturals) {
      if (silent(m.species) || silent(m.part) || silent(m.process)) {
        expect(byIdentity.has(m.id), m.name).toBe(false);
      }
    }
  });
});

describe("with no process said, no specification is excluded by process", () => {
  const groupRef = new Map(data.groups.map((g) => [g.id, g.reference]));
  const group078 = data.groups.find((g) => g.reference === "IFRA_STD_078")!;
  const styrax = data.materials.find((m) => m.type === "natural" && m.process.toLowerCase().includes("resinoide") && data.groupMembers.some((g) => g.memberId === m.id && groupRef.get(g.groupId) === "IFRA_STD_078"))!;

  // The adapter on the same data plus copies of a member of the STD 078 that say a different process, all in one build (it takes seconds).
  const PROCESSES = ["", "absoluto", "extracto", "resinoide"];
  const copies = PROCESSES.map((process, i) => ({ ...styrax, id: `M9999${i}`, name: `copia ${process || "sin proceso"}`, process, line: 0 }));
  const extended = {
    ...data,
    materials: [...data.materials, ...copies],
    groupMembers: [...data.groupMembers, ...copies.map((c) => ({ groupId: group078.id, memberId: c.id, subgroup: "", line: 0 }))],
  };
  const { details } = buildIfra(extended, IFRA_FILES);
  const pendingFor = (process: string) => details.get(v2Key(copies[PROCESSES.indexOf(process)]!.id))?.specPending ?? [];

  it("a member of the STD 078 that says no process keeps the specification pending; so do an absolute and an extract; only the resinoid is excluded", () => {
    expect(styrax).toBeDefined();
    expect(pendingFor("").some((t) => t.includes("078"))).toBe(true);
    expect(pendingFor("absoluto").some((t) => t.includes("078"))).toBe(true);
    expect(pendingFor("extracto").some((t) => t.includes("078"))).toBe(true);
    expect(pendingFor("resinoide").some((t) => t.includes("078"))).toBe(false);
  });
});
