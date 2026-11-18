import { describe, expect, it } from "vitest";
import { Ratio } from "../core/arith/ratio";
import type { Dilution } from "../db/catalog";
import { labelCode, parseLabelCode } from "./code";
import { dilutionLabel, type LabelMaterial } from "./content";
import { fitText, layoutFor } from "./layout";
import { tapeOf, TAPES } from "./media";
import { qrMatrix } from "./qr";

const ID = "3f2a9c1e-7b4d-4e8a-9f10-2c3d4e5f6a7b";

describe("label code (V3-105)", () => {
  it("names a bottle in a short code and reads back its id", () => {
    const code = labelCode("dilution", ID);
    expect(code).toBe("PF1:D:3F2A9C1E7B4D4E8A9F102C3D4E5F6A7B");
    expect(parseLabelCode(code)).toEqual({ kind: "dilution", id: ID });
    expect(parseLabelCode(` ${labelCode("material", ID)}\n`)).toEqual({ kind: "material", id: ID });
  });
  it("keeps an id that is not a UUID as it is, and ignores codes that are not ours", () => {
    expect(parseLabelCode(labelCode("material", "m-0042"))).toEqual({ kind: "material", id: "m-0042" });
    expect(parseLabelCode("https://example.com")).toBeNull();
    expect(parseLabelCode("PF1:X:abc")).toBeNull();
  });
  it("fits a bottle's code in a version 2 QR (25 modules), so it prints at 3 dots a module on 12 mm", () => {
    expect(qrMatrix(labelCode("dilution", ID)).length).toBe(25);
    const layout = layoutFor(tapeOf("GAP_12X40"), 25);
    expect(layout.qr.module).toBe(3);
    expect(layout.qr.y + layout.qr.side).toBeLessThanOrEqual(layout.height);
    expect(layout.width).toBe(320);
    expect(layout.text.width).toBeGreaterThan(180);
  });
});

const materials = new Map<string, LabelMaterial>([
  ["berg", { name: "Bergamot (FCF)", abbreviation: "Brg", cas: "8007-75-8" }],
  ["dpg", { name: "DPG (dipropylene glycol)", abbreviation: "Dipr", cas: "25265-71-8" }],
  ["eth", { name: "Ethanol", abbreviation: null, cas: "64-17-5" }],
  ["myst", { name: "Mystery base", abbreviation: null, cas: null }],
]);
const bottle = (over: Partial<Dilution>): Dilution => ({
  id: ID, fraction: Ratio.of(1n, 10n), solvent: null, madeOn: "2026-11-18", description: null, label: "al 10 %",
  materialMassUg: null, sourceDilutionId: null, archivedAt: null, diluents: [], ...over,
});
const dil = (diluentId: string) => ({ id: diluentId, diluentId, massUg: null, fraction: Ratio.of(9n, 10n) });

describe("dilution label content", () => {
  it("says material, strength in its diluents, CAS and date", () => {
    expect(dilutionLabel((id) => materials.get(id), "berg", bottle({ diluents: [dil("dpg")] }))).toEqual({
      code: "PF1:D:3F2A9C1E7B4D4E8A9F102C3D4E5F6A7B",
      title: "Bergamot",
      strength: "10 % in DPG",
      footer: "CAS 8007-75-8 · 2026-11-18",
    });
    expect(dilutionLabel((id) => materials.get(id), "berg", bottle({ diluents: [dil("eth"), dil("dpg")] })).strength).toBe("10 % in Ethanol + DPG");
  });
  it("leaves out what is unknown and says «Pure» for an undiluted bottle", () => {
    const pure = dilutionLabel((id) => materials.get(id), "myst", bottle({ fraction: Ratio.of(1n), label: null, madeOn: null }));
    expect(pure.strength).toBe("Pure");
    expect(pure.footer).toBe("");
    expect(dilutionLabel((id) => materials.get(id), "berg", bottle({ solvent: "DPG" })).strength).toBe("10 % in DPG");
  });
});

describe("text fitting", () => {
  const measure = (text: string, size: number) => text.length * size * 0.5;
  it("takes the largest size that fits, and cuts with «…» below the smallest", () => {
    expect(fitText("Bergamot", 100, 28, 16, measure)).toEqual({ text: "Bergamot", size: 25 });
    const cut = fitText("Labdanum absolute cistus ladaniferus", 100, 28, 16, measure);
    expect(cut.size).toBe(16);
    expect(cut.text.endsWith("…")).toBe(true);
    expect(measure(cut.text, 16)).toBeLessThanOrEqual(100);
  });
  it("lays out every tape of the P15 with room for text", () => {
    for (const tape of TAPES) expect(layoutFor(tape, 25).text.width).toBeGreaterThan(100);
  });
});

describe("the P15 driver", () => {
  it("turns a 12 × 40 mm label into an L11 raster job of 96 dots a row", async () => {
    const { WebMarklifePrinter, DEVICES } = await import("@thermal-label/marklife-web");
    const { printLabel } = await import("./printer");
    const sent: Uint8Array[] = [];
    const transport = {
      connected: true,
      write: async (data: Uint8Array) => void sent.push(data),
      read: async () => new Uint8Array(),
      close: async () => {},
    };
    const printer = new WebMarklifePrinter(DEVICES.P15, transport as never, { interChunkDelayMs: 0 });
    const width = 320, height = 96;
    const data = new Uint8Array(width * height * 4).fill(255);
    for (let i = 0; i < 40 * 4; i += 4) data[i] = data[i + 1] = data[i + 2] = 0; // a black stroke
    await printLabel(printer, { width, height, data }, tapeOf("GAP_12X40"));
    const bytes = Uint8Array.from(sent.flatMap((x) => [...x]));
    const enable = bytes.findIndex((b, i) => b === 0x10 && bytes[i + 1] === 0xff && bytes[i + 2] === 0xf1);
    expect(enable).toBeGreaterThanOrEqual(0);
    // GS v 0: 12 bytes a row (96 dots) and 320 rows, the label turned to the head.
    const at = bytes.findIndex((b, i) => b === 0x1d && bytes[i + 1] === 0x76 && bytes[i + 2] === 0x30);
    expect(at).toBeGreaterThanOrEqual(0);
    expect(bytes[at + 4] | (bytes[at + 5] << 8)).toBe(12);
    expect(bytes[at + 6] | (bytes[at + 7] << 8)).toBe(320);
    expect(sent.every((x) => x.length <= 95)).toBe(true);
  });
});
