import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import { labelPercent, linesOf } from "./content";
import { jobText, KEEP, parseJobs, withJob, type PrintJob } from "./jobs";

const pct = (p: string) => Ratio.fromDecimal(p).div(Ratio.of(100n));

describe("the % a label prints (the user, 2026-11-24)", () => {
  it("from 10 % up, a whole number, from the % you made it at", () => {
    expect(labelPercent(pct("9.94"), "at 10 %")).toBe("10 %");
    expect(labelPercent(pct("15.2"), "at 15 %")).toBe("15 %");
    expect(labelPercent(pct("29.71"), "at 30 %")).toBe("30 %");
    expect(labelPercent(pct("46.92"), null)).toBe("47 %");
  });
  it("below 10 %, two figures: a decimal only where it is small", () => {
    expect(labelPercent(pct("1.49"), "at 1.5 %")).toBe("1.5 %");
    expect(labelPercent(pct("2.31"), null)).toBe("2.3 %");
    expect(labelPercent(pct("1.003"), "at 1 %")).toBe("1 %");
    expect(labelPercent(pct("5.04"), "at 5 %")).toBe("5 %");
    expect(labelPercent(pct("0.249"), "at 0.25 %")).toBe("0.25 %");
    expect(labelPercent(pct("0.0098"), null)).toBe("0.0098 %");
  });
  it("what was weighed, when it is far from the % you gave", () => {
    expect(labelPercent(pct("7.81"), "at 10 %")).toBe("7.8 %");
  });
});

describe("a batch's print text, kept apart (2026-11-24)", () => {
  const job = (id: string): PrintJob => ({ id, savedAt: "2026-11-24T12:00:00Z", day: "2026-11-24", lines: [{ big: "Wool · 10 % in Ethanol", small: "CAS 91079-01-5 · 2026-11-24" }] });
  it("reads back what it wrote, and nothing that is not a job", () => {
    expect(parseJobs(JSON.stringify([job("a"), { id: 3 }, null]))).toEqual([job("a")]);
    expect(parseJobs("not json")).toEqual([]);
    expect(parseJobs(null)).toEqual([]);
  });
  it("puts the newest first and keeps the last ones", () => {
    let list: PrintJob[] = [];
    for (let i = 0; i < KEEP + 5; i++) list = withJob(list, job(String(i)));
    expect(list.length).toBe(KEEP);
    expect(list[0].id).toBe(String(KEEP + 4));
  });
  it("is the label page's text: «big | small», one a line", () => {
    expect(jobText(job("a"))).toBe("Wool · 10 % in Ethanol | CAS 91079-01-5 · 2026-11-24");
    expect(linesOf({ code: "", title: "Wool", strength: "10 % in Ethanol", footer: "2026-11-24", cas: "", date: "" })).toEqual({ big: "Wool · 10 % in Ethanol", small: "2026-11-24" });
  });
});
