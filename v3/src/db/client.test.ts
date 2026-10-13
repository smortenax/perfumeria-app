import { describe, expect, it, vi } from "vitest";

vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({}) }));
const { storedUser } = await import("./client");

describe("storedUser: the session kept in the browser, to open without network", () => {
  const stored = (value: string | null) => () => value;

  it("reads the user of a kept session", () => {
    const session = JSON.stringify({ access_token: "x", user: { id: "u-1", email: "a@b.test" } });
    expect(storedUser(stored(session))).toEqual({ id: "u-1", email: "a@b.test" });
  });

  it("finds no one without a session, or with a broken one", () => {
    expect(storedUser(stored(null))).toBeNull();
    expect(storedUser(stored("{not json"))).toBeNull();
    expect(storedUser(stored(JSON.stringify({ user: {} })))).toBeNull();
  });
});
