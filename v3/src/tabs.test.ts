import { describe, expect, it } from "vitest";
import { tabAfterKey } from "./tabs";

describe("tabAfterKey", () => {
  it("steps with the arrows and wraps at both ends", () => {
    expect(tabAfterKey("ArrowRight", 0, 4)).toBe(1);
    expect(tabAfterKey("ArrowRight", 3, 4)).toBe(0);
    expect(tabAfterKey("ArrowLeft", 2, 4)).toBe(1);
    expect(tabAfterKey("ArrowLeft", 0, 4)).toBe(3);
  });

  it("jumps to the ends with Home and End", () => {
    expect(tabAfterKey("Home", 2, 4)).toBe(0);
    expect(tabAfterKey("End", 1, 4)).toBe(3);
  });

  it("moves nothing on any other key, or in an empty list", () => {
    expect(tabAfterKey("Enter", 1, 4)).toBeNull();
    expect(tabAfterKey("ArrowDown", 1, 4)).toBeNull();
    expect(tabAfterKey("ArrowRight", 0, 0)).toBeNull();
  });

  it("counts a selection that is not in the list as the first tab", () => {
    expect(tabAfterKey("ArrowRight", -1, 3)).toBe(1);
    expect(tabAfterKey("ArrowLeft", -1, 3)).toBe(2);
  });
});
