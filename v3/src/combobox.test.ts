import { describe, expect, it } from "vitest";
import { comboFieldProps, comboKey, optionId } from "./combobox";

describe("a search with its results, as ARIA's combobox (F-01, F-03)", () => {
  it("moves the highlight with the arrows and wraps", () => {
    expect(comboKey("ArrowDown", 0, 3)).toEqual({ kind: "move", to: 1 });
    expect(comboKey("ArrowDown", 2, 3)).toEqual({ kind: "move", to: 0 });
    expect(comboKey("ArrowUp", 0, 3)).toEqual({ kind: "move", to: 2 });
  });

  it("picks the highlighted result with Enter or Tab, the single one too", () => {
    expect(comboKey("Enter", 1, 3)).toEqual({ kind: "choose", at: 1 });
    expect(comboKey("Enter", 0, 1)).toEqual({ kind: "choose", at: 0 });
    expect(comboKey("Tab", 0, 1)).toEqual({ kind: "choose", at: 0 });
    expect(comboKey("Tab", 0, 1, true)).toBeNull();
    // A highlight left past the end, after the list shrank, counts as the last.
    expect(comboKey("Enter", 5, 2)).toEqual({ kind: "choose", at: 1 });
  });

  it("leaves the field's own keys alone, and closes with Escape", () => {
    expect(comboKey("a", 0, 3)).toBeNull();
    expect(comboKey("Enter", 0, 0)).toBeNull();
    expect(comboKey("Escape", 0, 0)).toEqual({ kind: "close" });
  });

  it("names the highlighted option only while the list is shown", () => {
    expect(comboFieldProps("list", true, 3, 1)).toMatchObject({ role: "combobox", "aria-expanded": true, "aria-controls": "list", "aria-activedescendant": optionId("list", 1) });
    expect(comboFieldProps("list", false, 3, 1)["aria-activedescendant"]).toBeUndefined();
    expect(comboFieldProps("list", true, 0, 0)["aria-expanded"]).toBe(false);
  });
});
