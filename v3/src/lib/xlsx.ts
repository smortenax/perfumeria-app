/**
 * Reads the first sheet of an .xlsx as rows of text, in the browser and with nothing to install: an
 * .xlsx is a zip of XML files, unzipped here with the platform's DecompressionStream. Only what a
 * table needs: text (shared or inline), numbers, booleans and the cached result of a formula; a
 * formula never computed (a sheet written by a script) reads as empty.
 *
 * A number shown as a percentage is read as the user sees it: 0.5 in a «0.0 %» cell is «50». The
 * shift is done on the digits, not with floating point, so 0.15 is «15» and not «15.000000000000002».
 */

/** The rows of the first sheet; each row as long as its last cell, empty cells as "". */
export async function readXlsxRows(data: ArrayBuffer | Uint8Array): Promise<string[][]> {
  const files = await unzip(data instanceof Uint8Array ? data : new Uint8Array(data));
  const text = (name: string) => (files.has(name) ? new TextDecoder().decode(files.get(name)) : null);
  const sheetPath = firstSheetPath(text("xl/workbook.xml"), text("xl/_rels/workbook.xml.rels")) ?? [...files.keys()].filter((n) => /^xl\/worksheets\/[^/]+\.xml$/.test(n)).sort()[0];
  const sheet = sheetPath ? text(sheetPath) : null;
  if (!sheet) throw new Error("This .xlsx has no sheet.");
  return sheetRows(sheet, sharedStrings(text("xl/sharedStrings.xml")), percentStyles(text("xl/styles.xml")));
}

const unescape = (s: string) =>
  s.replace(/&(lt|gt|quot|apos|amp|#x[0-9a-f]+|#\d+);/gi, (_, e: string) => {
    const named: Record<string, string> = { lt: "<", gt: ">", quot: '"', apos: "'", amp: "&" };
    if (named[e.toLowerCase()]) return named[e.toLowerCase()];
    return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
  });

const attr = (tag: string, name: string): string | null => new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1] ?? null;

/** The text of every <t> inside a fragment (a shared string with runs of formatting is several). */
const texts = (xml: string) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => unescape(m[1])).join("");

function sharedStrings(xml: string | null): string[] {
  if (!xml) return [];
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>|<si\/>/g)].map((m) => texts(m[1] ?? ""));
}

/** Which cell styles (their index, the «s» of a cell) show a number as a percentage. */
function percentStyles(xml: string | null): Set<number> {
  const out = new Set<number>();
  if (!xml) return out;
  const custom = new Map<string, string>();
  for (const m of xml.matchAll(/<numFmt\s[^>]*>/g)) custom.set(attr(m[0], "numFmtId") ?? "", unescape(attr(m[0], "formatCode") ?? ""));
  const xfs = /<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/.exec(xml)?.[1] ?? "";
  [...xfs.matchAll(/<xf\s[^>]*?\/?>/g)].forEach((m, i) => {
    const id = attr(m[0], "numFmtId") ?? "0";
    const code = custom.get(id) ?? "";
    // Built-in 9 and 10 are «0%» and «0.00%»; a custom one, if it has a % outside quotes.
    if (id === "9" || id === "10" || code.replace(/"[^"]*"/g, "").replace(/\\%/g, "").includes("%")) out.add(i);
  });
  return out;
}

function firstSheetPath(workbook: string | null, rels: string | null): string | null {
  if (!workbook || !rels) return null;
  const sheet = /<sheet\s[^>]*>/.exec(workbook)?.[0];
  const rid = sheet ? attr(sheet, "r:id") : null;
  const rel = [...rels.matchAll(/<Relationship\s[^>]*>/g)].map((m) => m[0]).find((r) => attr(r, "Id") === rid);
  const target = rel ? attr(rel, "Target") : null;
  if (!target) return null;
  return target.startsWith("/") ? target.slice(1) : `xl/${target}`;
}

/** «C12» → 2 (columns from 0). */
const columnOf = (ref: string) => [...(/^[A-Z]+/.exec(ref)?.[0] ?? "A")].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;

function sheetRows(xml: string, shared: readonly string[], percent: ReadonlySet<number>): string[][] {
  const rows: string[][] = [];
  for (const r of xml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const at = Number(attr(r[1], "r") ?? rows.length + 1) - 1;
    const row: string[] = [];
    for (const c of (r[2] ?? "").matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = attr(c[1], "r");
      const col = ref ? columnOf(ref) : row.length;
      const type = attr(c[1], "t");
      const inner = c[2] ?? "";
      const v = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1];
      let value = "";
      if (type === "s") value = v !== undefined ? (shared[Number(v)] ?? "") : "";
      else if (type === "inlineStr") value = texts(/<is>([\s\S]*?)<\/is>/.exec(inner)?.[1] ?? "");
      else if (type === "b") value = v === "1" ? "TRUE" : v === "0" ? "FALSE" : "";
      else if (type === "str" || type === "e") value = v !== undefined ? unescape(v) : "";
      else if (v !== undefined) value = percent.has(Number(attr(c[1], "s") ?? "0")) ? times100(plainNumber(v)) : plainNumber(v);
      while (row.length < col) row.push("");
      row[col] = value;
    }
    while (rows.length < at) rows.push([]);
    rows[at] = row;
  }
  return rows;
}

/** A number as Excel stores it («0.15», «1.4999999999999999E-2») as the shortest decimal, without exponent. */
export function plainNumber(v: string): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return v.trim();
  const [mantissa, exp = "0"] = String(Number(n.toPrecision(15))).split("e");
  return shift(mantissa, Number(exp));
}

/** The digits of a decimal moved two places: «0.005» → «0.5», «1» → «100». */
export const times100 = (dec: string): string => shift(dec, 2);

function shift(dec: string, places: number): string {
  const negative = dec.startsWith("-");
  const [whole, frac = ""] = (negative ? dec.slice(1) : dec).split(".");
  const digits = whole + frac;
  const point = whole.length + places;
  const padded = point <= 0 ? "0".repeat(1 - point) + digits : digits.padEnd(point, "0");
  const at = Math.max(point, 1);
  const int = padded.slice(0, at).replace(/^0+(?=\d)/, "");
  const rest = padded.slice(at).replace(/0+$/, "");
  return (negative ? "-" : "") + (rest ? `${int}.${rest}` : int);
}

// ——— The zip ———

async function unzip(bytes: Uint8Array): Promise<Map<string, Uint8Array>> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65535); i--)
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  if (end < 0) throw new Error("This is not an .xlsx (not a zip).");
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const files = new Map<string, Uint8Array>();
  for (let k = 0; k < count; k++) {
    if (view.getUint32(at, true) !== 0x02014b50) throw new Error("This .xlsx is damaged.");
    const method = view.getUint16(at + 10, true);
    const size = view.getUint32(at + 20, true);
    const nameLength = view.getUint16(at + 28, true);
    const extra = view.getUint16(at + 30, true);
    const comment = view.getUint16(at + 32, true);
    const local = view.getUint32(at + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(at + 46, at + 46 + nameLength));
    at += 46 + nameLength + extra + comment;
    if (!/\.(xml|rels)$/.test(name)) continue;
    const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
    const raw = bytes.subarray(start, start + size);
    if (method === 0) files.set(name, raw);
    else if (method === 8) files.set(name, await inflate(raw));
  }
  return files;
}

async function inflate(raw: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([raw as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
