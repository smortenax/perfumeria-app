import { deflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { readDilutionRows } from "../dilution/plan-import";
import { plainNumber, readXlsxRows, times100 } from "./xlsx";

/** A minimal zip (the format an .xlsx is), written here so the test needs no file. */
function zip(files: Record<string, string>, store = false): Uint8Array {
  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const raw = Buffer.from(text, "utf8");
    const data = store ? raw : deflateRawSync(raw);
    const n = Buffer.from(name, "utf8");
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(store ? 0 : 8, 8);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(n.length, 26);
    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50, 0);
    dir.writeUInt16LE(store ? 0 : 8, 10);
    dir.writeUInt32LE(data.length, 20);
    dir.writeUInt32LE(raw.length, 24);
    dir.writeUInt16LE(n.length, 28);
    dir.writeUInt32LE(offset, 42);
    parts.push(local, n, data);
    central.push(dir, n);
    offset += 30 + n.length + data.length;
  }
  const size = central.reduce((s, b) => s + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(files).length, 8);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(size, 12);
  end.writeUInt32LE(offset, 16);
  return new Uint8Array(Buffer.concat([...parts, ...central, end]));
}

/** The shape of the lab's sheet of 2026-11-25 (diluciones-25-nov.xlsx): a title, its instructions, the Spanish header, % cells, formulas never computed, a footer after a blank row. */
const strings = ["Diluciones de la tanda", "Material", "Frasco", "Diluyente", "% del material de partida", "% objetivo", "Total objetivo (g)", "Material real (g)", "Notas", "Wool Absolute (Biolandes)", "20 ml", "Alcohol 96º", "pasta &amp; frío", "Meta Cresol", "DPG", "Diluyente que vas a necesitar"];
const row = (r: number, cells: string) => `<row r="${r}">${cells}</row>`;
const s = (ref: string, i: number) => `<c r="${ref}" t="s"><v>${i}</v></c>`;
const n = (ref: string, v: string, style = 0) => `<c r="${ref}" s="${style}"><v>${v}</v></c>`;
const SHEET = `<worksheet><sheetData>
${row(1, s("A1", 0))}
${row(3, s("A3", 1) + s("B3", 2) + s("C3", 3) + s("D3", 4) + s("E3", 5) + s("F3", 6) + `<c r="G3" s="0"><f>F3*E3</f></c>` + s("H3", 7) + s("I3", 8))}
${row(4, s("A4", 9) + s("B4", 10) + s("C4", 11) + n("D4", "1", 1) + n("E4", "1.0000000000000001E-3", 1) + n("F4", "15") + `<c r="G4"><f>F4*E4/D4</f></c>` + n("H4", "0.0149") + s("I4", 12))}
${row(5, s("A5", 13) + s("B5", 10) + s("C5", 14) + n("D5", "0.1", 2) + n("E5", "0.15", 2) + n("F5", "15"))}
${row(7, s("A7", 15))}
</sheetData></worksheet>`;
const FILES = {
  "[Content_Types].xml": "<Types/>",
  "xl/workbook.xml": `<workbook><sheets><sheet name="Diluciones" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  "xl/_rels/workbook.xml.rels": `<Relationships><Relationship Id="rId1" Type="worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
  "xl/sharedStrings.xml": `<sst>${strings.map((x) => `<si><t>${x}</t></si>`).join("")}</sst>`,
  "xl/styles.xml": `<styleSheet><numFmts count="1"><numFmt numFmtId="164" formatCode="0.0##%"/></numFmts><cellXfs count="3"><xf numFmtId="0"/><xf numFmtId="164"/><xf numFmtId="10"/></cellXfs></styleSheet>`,
  "xl/worksheets/sheet1.xml": SHEET,
};

describe("reading an .xlsx", () => {
  it("text, numbers and % cells as the user sees them; a formula never computed is empty", async () => {
    const rows = await readXlsxRows(zip(FILES));
    expect(rows[0]).toEqual(["Diluciones de la tanda"]);
    expect(rows[1]).toEqual([]);
    expect(rows[3]).toEqual(["Wool Absolute (Biolandes)", "20 ml", "Alcohol 96º", "100", "0.1", "15", "", "0.0149", "pasta & frío"]);
    expect(rows[4]).toEqual(["Meta Cresol", "20 ml", "DPG", "10", "15", "15"]);
  });

  it("stored (not compressed) files too", async () => {
    expect((await readXlsxRows(zip(FILES, true)))[4][0]).toBe("Meta Cresol");
  });

  it("refuses what is not a zip", async () => {
    await expect(readXlsxRows(new TextEncoder().encode("material,fraction_pct"))).rejects.toThrow();
  });

  it("moves the digits, not floating point", () => {
    expect([times100("0.15"), times100("0.005"), times100("1"), times100("0.0001"), times100("12.5")]).toEqual(["15", "0.5", "100", "0.01", "1250"]);
    expect([plainNumber("1.0000000000000001E-3"), plainNumber("1E-7"), plainNumber("15")]).toEqual(["0.001", "0.0000001", "15"]);
  });

  it("the lab's sheet becomes the planned table: Spanish header found below the title, footer left out", async () => {
    const plan = readDilutionRows(await readXlsxRows(zip(FILES)));
    expect(plan.ok && plan.rows.map((r) => [r.line, r.material, r.fractionPct, r.fromPct, r.bottleMl, r.batchG, r.diluent, r.materialWeighedG, r.note])).toEqual([
      [4, "Wool Absolute (Biolandes)", "0.1", "100", "20", "15", "Alcohol 96º", "0.0149", "pasta & frío"],
      [5, "Meta Cresol", "15", "10", "20", "15", "DPG", "", ""],
    ]);
  });
});
