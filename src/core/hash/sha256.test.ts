import { describe, expect, it } from "vitest";
import { sha256Hex } from "./sha256";

describe("sha256Hex", () => {
  it("matches the FIPS 180-4 test vectors", () => {
    expect(sha256Hex("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(sha256Hex("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq")).toBe(
      "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1",
    );
  });

  it("agrees with Python's hashlib across block boundaries and accented text", () => {
    // Digests computed with hashlib.sha256(text.encode("utf-8")) on 2026-09-26.
    const cases: Array<[string, string]> = [
      ["a".repeat(55), "9f4390f8d30c2dd92ec9f095b65e2b9ae9b0a925a5258e241c9f1e910f734318"],
      ["a".repeat(56), "b35439a4ac6f0948b6d6f9e3c6af0f5f590ce20f1bde7090ef7970686ec6738a"],
      ["a".repeat(64), "ffe054fe7ae0cb6dc65c3af9b61d5209f439851db43d0ba5997337df154668eb"],
      ["Lejía · 0,996 % en DPG", "5b864bd7d767a628377cfcd439515c45ea67159c8299cf9edcf9e9a8fc0b515c"],
      ["x".repeat(1000), "44f8354494a5ba03ba1792a8d3e9c534c47a9181980fde7a3f44b06ef2ae7c7f"],
    ];
    for (const [text, digest] of cases) {
      expect(sha256Hex(text)).toBe(digest);
    }
  });
});
