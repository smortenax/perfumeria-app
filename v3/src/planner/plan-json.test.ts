import zaraFile from "./fixtures/zara-ide-pisos-v4.plan.json?raw";
import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { PLAN_FORMAT, planFromJson, planToJson } from "./plan-json";

/** The plan file, perfumeria/plan/1 (V3-100), with the real floor split of Zara Tobacco IDE v4. */

const zara = zaraFile;
const read = (doc: unknown) => planFromJson(JSON.stringify(doc));
const line = (l: Record<string, unknown>) => read({ format: PLAN_FORMAT, lines: [l] });

describe("reading a plan file", () => {
  it("reads Zara v4: 28 lines in 8 groups (the brief said 10; the file has 8), exact parts, in the file's order", () => {
    const r = planFromJson(zara);
    if (!r.ok) throw new Error(r.problem);
    expect(r.plan.name).toBe("Zara Tobacco IDE · reparto áureo por pisos v4");
    expect(r.plan.created).toBe("2026-11-06");
    expect(r.plan.lines).toHaveLength(28);
    expect(new Set(r.plan.lines.map((l) => l.group)).size).toBe(8);
    expect(r.plan.lines.every((l) => l.problem === null)).toBe(true);
    expect(Ratio.sum(r.plan.lines.map((l) => l.parts!)).toString()).toBe("9997/100");
    const kephalis = r.plan.lines.find((l) => l.material === "Kephalis")!;
    expect([kephalis.index, kephalis.parts!.toString(), kephalis.shape, kephalis.cas]).toEqual([11, "1363/100", null, "36306-87-3"]);
    // The real cases for matching: Timbersilk without id or CAS, Prunella with an id and no CAS.
    const timbersilk = r.plan.lines.find((l) => l.material === "Timbersilk")!;
    expect([timbersilk.materialId, timbersilk.cas]).toEqual([null, null]);
    expect(r.plan.lines.find((l) => l.material === "Prunella")!.cas).toBeNull();
  });

  it("refuses a format it does not know, and what is not a plan", () => {
    expect(read({ format: "perfumeria/plan/2", lines: [] })).toEqual({ ok: false, problem: "unknown-format", format: "perfumeria/plan/2" });
    expect(read({ format: "perfumeria/formula/1" })).toMatchObject({ ok: false, problem: "unknown-format" });
    expect(read({ lines: [] })).toEqual({ ok: false, problem: "not-a-plan" });
    expect(planFromJson("{ not json")).toEqual({ ok: false, problem: "not-json" });
    expect(read({ format: PLAN_FORMAT, lines: [] })).toEqual({ ok: false, problem: "no-lines" });
  });

  it("marks a wrong line instead of guessing: a float, zero, no name or an unknown shape", () => {
    const problem = (l: Record<string, unknown>) => {
      const r = line(l);
      return r.ok ? r.plan.lines[0].problem : r.problem;
    };
    expect(problem({ material: "Iso E Super", parts: 7.17 })).toBe("parts");
    expect(problem({ material: "Iso E Super", parts: "0" })).toBe("parts");
    expect(problem({ material: "Iso E Super", parts: "-1" })).toBe("parts");
    expect(problem({ material: "Iso E Super", parts: "1/3" })).toBe("parts");
    expect(problem({ parts: "2" })).toBe("no-material");
    expect(problem({ material: "Iso E Super", parts: "2", shape: "sudden" })).toBe("shape");
    expect(problem({ material: "Iso E Super", parts: "1363", shape: "plateau" })).toBeNull();
  });
});

describe("writing a plan file", () => {
  it("writes exact decimal text and reads back the same plan", () => {
    const text = planToJson({
      name: "Floors v5",
      created: "2026-11-07",
      lines: [
        { material: "Kephalis", materialId: "c8896fa6-8958-575e-bd2b-ec417fce3bd3", cas: "36306-87-3", parts: Ratio.fromDecimal("13.63"), shape: null, group: "Heart-base · Wood" },
        { material: "Timbersilk", materialId: "44444444-4444-4444-8444-444444444444", cas: null, parts: Ratio.of(4), shape: "linear", group: null },
      ],
    });
    const doc = JSON.parse(text);
    expect(doc.format).toBe(PLAN_FORMAT);
    expect(doc.partsBasis).toBe("pure material, relative");
    expect(doc.lines.map((l: { parts: string }) => l.parts)).toEqual(["13.63", "4"]);
    const back = planFromJson(text);
    if (!back.ok) throw new Error(back.problem);
    expect(back.plan.lines.map((l) => [l.material, l.materialId, l.cas, l.parts!.toString(), l.shape, l.group])).toEqual([
      ["Kephalis", "c8896fa6-8958-575e-bd2b-ec417fce3bd3", "36306-87-3", "1363/100", null, "Heart-base · Wood"],
      ["Timbersilk", "44444444-4444-4444-8444-444444444444", null, "4", "linear", null],
    ]);
  });

  it("reading Zara and writing it again keeps every line, part and group", () => {
    const r = planFromJson(zara);
    if (!r.ok) throw new Error(r.problem);
    const out = planToJson({
      name: r.plan.name!,
      created: r.plan.created!,
      source: r.plan.source,
      lines: r.plan.lines.map((l) => ({ material: l.material, materialId: l.materialId ?? "", cas: l.cas, parts: l.parts!, shape: l.shape, group: l.group })),
    });
    const again = planFromJson(out);
    if (!again.ok) throw new Error(again.problem);
    expect(again.plan.lines.map((l) => [l.material, l.parts!.toString(), l.group])).toEqual(r.plan.lines.map((l) => [l.material, l.parts!.toString(), l.group]));
  });
});
