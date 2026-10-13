import { describe, expect, it, vi } from "vitest";

vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({}) }));
vi.mock("@powersync/web", () => ({ UpdateType: { PUT: "PUT", PATCH: "PATCH", DELETE: "DELETE" } }));
const { powerSyncEndpoint } = await import("./connector");

describe("powerSyncEndpoint: PowerSync's address, whole and without a final slash", () => {
  it("makes a path of the app's own site whole", () => {
    expect(powerSyncEndpoint("/powersync", "http://localhost:5173")).toBe("http://localhost:5173/powersync");
  });

  it("keeps an address of its own, without the final slash", () => {
    expect(powerSyncEndpoint("https://abc.powersync.journeyapps.com/", "http://localhost:5173")).toBe(
      "https://abc.powersync.journeyapps.com",
    );
    expect(powerSyncEndpoint("http://127.0.0.1:8080", "http://localhost:5173")).toBe("http://127.0.0.1:8080");
  });
});
