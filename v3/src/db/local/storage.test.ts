import { describe, expect, it } from "vitest";
import { storageFor } from "./storage";

const SAFARI_IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
const CHROME_IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/138.0.0.0 Mobile/15E148 Safari/604.1";
const SAFARI_MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15";
const CHROME_WINDOWS = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36";
const EDGE_WINDOWS = `${CHROME_WINDOWS} Edg/138.0.0.0`;
const FIREFOX = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0";

describe("storageFor", () => {
  it("puts Safari and every browser on an iPhone on OPFS", () => {
    expect(storageFor(SAFARI_IPHONE, true)).toBe("opfs");
    expect(storageFor(CHROME_IPHONE, true)).toBe("opfs");
    expect(storageFor(SAFARI_MAC, true)).toBe("opfs");
  });

  it("leaves Chromium and Firefox on IndexedDB, with the copy they already hold", () => {
    expect(storageFor(CHROME_WINDOWS, true)).toBe("indexeddb");
    expect(storageFor(EDGE_WINDOWS, true)).toBe("indexeddb");
    expect(storageFor(FIREFOX, true)).toBe("indexeddb");
  });

  it("keeps IndexedDB where OPFS is missing (a private window in Safari)", () => {
    expect(storageFor(SAFARI_IPHONE, false)).toBe("indexeddb");
  });
});
