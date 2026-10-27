import { describe, expect, it } from "vitest";
import { readRecent, withRecent } from "./recent";

/** What you opened last (F21). */

describe("the recent list", () => {
  it("newest first, each once, and short", () => {
    let list = withRecent([], { kind: "formula", id: "a", at: 1 });
    list = withRecent(list, { kind: "material", id: "m", at: 2 });
    list = withRecent(list, { kind: "formula", id: "a", at: 3 });
    expect(list.map((r) => `${r.kind}:${r.id}`)).toEqual(["formula:a", "material:m"]);
    for (let i = 0; i < 20; i++) list = withRecent(list, { kind: "material", id: `x${i}`, at: 10 + i });
    expect(list).toHaveLength(12);
  });
  it("what the browser keeps badly reads as nothing", () => {
    expect(readRecent(() => "{bad")).toEqual([]);
    expect(readRecent(() => null)).toEqual([]);
    expect(readRecent(() => JSON.stringify([{ kind: "x", id: 1 }, { kind: "formula", id: "f", at: 5 }]))).toEqual([{ kind: "formula", id: "f", at: 5 }]);
  });
});
