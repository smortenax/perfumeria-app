import { describe, expect, it } from "vitest";
import { buttonClass } from "./Button";

describe("the app's buttons (audit F-11 L2)", () => {
  it("names the variant, and keeps a class of the screen beside it", () => {
    expect(buttonClass("primary")).toBe("btn btn-primary");
    expect(buttonClass("danger", "delete-session")).toBe("btn btn-danger delete-session");
    expect(buttonClass("secondary", "")).toBe("btn btn-secondary");
  });
});
