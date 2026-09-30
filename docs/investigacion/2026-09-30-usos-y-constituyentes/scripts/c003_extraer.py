#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""C-003: allergen declarations of the Perfumiarz PDFs -> % of each IFRA-standard allergen.

Usage:  c003_extraer.py            (needs PyMuPDF: pip install pymupdf; or set C003_LIB to a
                                    folder that holds it, e.g. `pip install --target DIR pymupdf`)

Why coordinates. `pdftotext -layout` scrambles these tables: the allergen name is centred in
tall cells, the CAS numbers of a group sit on several lines, and the % column drifts by one
row. So the text is read with its position (PyMuPDF words) and every figure is attached to
its allergen by the row it stands on:
  1. the CAS number(s) on the same row of the figure;
  2. else the allergen name on that row (fuzzy match against the EU list);
  3. else the nearest CAS line (<= 14 pt), for groups whose figure is centred in the cell.
The allergen groups (INCI name -> all its CAS) come from the EU list (GROUPS below, taken from
a Ventos declaration and patched by hand for the entries that document wraps or lacks).

Column rule. Many layouts have several figure columns (direct / indirect natural / indirect
synthetic / total; % natural / % synthetic / % total). The column taken is always the
**total of the product** (header «Total»); with a single column, that one. A «< x» with
ppm or mg/kg that repeats down the table is a quantification limit, not a figure: skipped.

Writes, in ../lotes/:
  C-003.csv               same columns as C-002.csv, glossary products
  C-003-sin-glosario.csv  products with no (or ambiguous) glossary row; candidates in `notas`
  C-003-diagnostico.json  per-document outcome, for the summary
No number is estimated; nothing unknown is written as 0 (a list that declares none is a
`sin-cifra` row).
"""
import csv, json, os, re, sys, collections, difflib, statistics
from decimal import Decimal

sys.path.insert(0, os.path.dirname(__file__))
if os.environ.get("C003_LIB"):
    sys.path.insert(0, os.environ["C003_LIB"])
import pymupdf  # noqa: E402
from c002_lib import (REPO, MAIN, CACHE, load_catalogue, resolve_material, cas_ok, CAS_RE)  # noqa: E402

LOTES = os.path.join(REPO, "docs/investigacion/2026-09-30-usos-y-constituyentes/lotes")
DOCS = os.path.join(CACHE, "documentos")
TODAY = "2026-10-01"
COLS = ["material_id", "cas", "nombre", "constituyente", "cas_constituyente", "estandar_ifra", "min_pct", "max_pct",
        "tipo_valor", "fuente", "tipo_fuente", "url", "consultado", "cita", "notas"]

# ------------------------------------------------------------------ EU allergen groups
GROUPS_RAW = """3-Propylidenephthalide|17369-59-4
6-Methyl Coumarin|92-48-8
Acetyl Cedrene|32388-55-9
Alpha-Isomethyl Ionone|127-51-5
Alpha-Terpinene|99-86-5
Amyl Cinnamal|122-40-7
Amyl Salicylate|2050-08-0
Amylcinnamyl Alcohol|101-85-9
Anethole|104-46-1 4180-23-8
Anise Alcohol|105-13-5
Benzaldehyde|100-52-7
Benzyl Alcohol|100-51-6
Benzyl Benzoate|120-51-4
Benzyl Cinnamate|103-41-3
Benzyl Salicylate|118-58-1
Beta-Caryophyllene|87-44-5
Butylphenyl Methylpropional|80-54-6
Camphor|21368-68-3 464-48-2 464-49-3 76-22-2
Cananga Odorata Oil/Extract|68606-83-7 8006-81-3 83863-30-3 93686-30-7
Carvone|2244-16-8 6485-40-1 99-49-0
Cedrus Atlantica Oil/Extract|8023-85-6 92201-55-3
Cinnamal|104-55-2
Cinnamomum Cassia Leaf Oil|8007-80-5 84961-46-6
Cinnamomum Zeylanicum Bark Oil|8015-91-6 84649-98-9
Cinnamyl Alcohol|104-54-1
Citral|106-26-3 141-27-5 5392-40-5
Citronellol|106-22-9 1117-61-9 26489-01-0 7540-51-4
Citrus Aurantium Bergamia Peel Oil|68648-33-9 8007-75-8 85049-52-1 89957-91-5
Citrus Aurantium Amara and Dulcis Flower Oil|72968-50-4 8016-38-4 8028-48-6
Citrus Aurantium Amara and Dulcis Peel Oil|68916-04-1 8008-57-9 97766-30-8
Citrus Limon Peel Oil|8008-56-8 84929-31-7
Coumarin|91-64-5
Dimethyl Phenethyl Acetate|151-05-3
Eucalyptus Globulus Oil|8000-48-4 97926-40-4
Eugenia Caryophyllus Oil|8000-34-8 8015-97-2 84961-50-2
Eugenol|97-53-0
Eugenyl Acetate|93-28-7
Evernia Furfuracea Extract|90028-67-4 68648-41-9
Evernia Prunastri Extract|90028-68-5 68917-10-2
Farnesol|4602-84-0
Geraniol|106-24-1
Geranyl Acetate|105-87-3
Hexadecanolactone|109-29-5
Hexamethylindanopyran|1222-05-5
Hexyl Cinnamal|101-86-0
Hydroxycitronellal|107-75-5
Hydroxyisohexyl 3-Cyclohexene Carboxaldehyde|31906-04-4 51414-25-6
Isoeugenol|5912-86-7 5932-68-3 97-54-1
Isoeugenyl Acetate|93-29-8
Jasmine Oil/Extract|8022-96-6 8024-43-9 84776-64-7 90045-94-6
Juniperus Virginiana Oil|8000-27-9 85085-41-2
Laurus Nobilis Leaf Oil|8002-41-3 8007-48-5 84603-73-6
Lavandula Oil/Extract|8000-28-0 8022-15-9 84776-65-8 90063-37-9 91722-69-9 92623-76-2 93455-96-0 93455-97-1
Lemongrass Oil|8007-02-1 89998-16-3 91844-92-7
Limonene|138-86-3 5989-27-5 5989-54-8 7705-14-8
Linalool|78-70-6
Linalyl Acetate|115-95-7
Lippia Citriodora Absolute|8024-12-2 85116-63-8
Mentha Piperita Oil|8006-90-4 84082-70-2
Mentha Viridis Leaf Oil|8008-79-5 84696-51-5
Menthol|1490-04-6 15356-60-2 2216-51-5 89-78-1
Methyl 2-Octynoate|111-12-6
Methyl Salicylate|119-36-8
Myroxylon Pereirae Oil/Extract|8007-00-9
Narcissus Extract|68917-12-4 90064-25-8 90064-26-9 90064-27-0
Pelargonium Graveolens Flower Oil|8000-46-2 90082-51-2
Pinene|127-91-3 18172-67-3 7785-70-8 80-56-8
Pinus Mugo|90082-72-7
Pinus Pumila|97676-05-6
Pogostemon Cablin Oil|8014-09-3 84238-39-1
Rose Flower Oil/Extract|8007-01-0 84604-12-6 84604-13-7 84696-47-9 90106-38-0 92347-25-6 93334-48-6
Rose Ketones|23696-85-7 23726-91-2 23726-92-3 23726-94-5 24720-09-0 43052-87-5 57378-68-4 71048-82-3
Salicylaldehyde|90-02-8
Santalol|11031-45-1 115-71-9 77-42-9
Santalum Album Oil|8006-87-9 84787-70-2
Sclareol|515-03-7
Terpineol|138-87-4 586-81-2 8000-41-7 98-55-5
Terpinolene|586-62-9
Tetramethyl Acetyloctahydronaphthalenes|54464-57-2 54464-59-4 68155-66-8 68155-67-9
Trimethylbenzenepropanol|103694-68-4
Trimethylcyclopentenyl Methylisopentenol|67801-20-1
Turpentine Oil/Extract|8006-64-2 8052-14-0 9005-90-7
Vanillin|121-33-5"""
GROUPS = []          # (name, [cas...])
CAS2G = {}
for ln in GROUPS_RAW.split("\n"):
    n, c = ln.split("|")
    GROUPS.append((n, c.split()))
    for x in c.split():
        CAS2G.setdefault(x, len(GROUPS) - 1)


def norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())


GNORM = [norm(n) for n, _ in GROUPS]
# names the suppliers use for the same group
ALIAS = {"anisylalcohol": "Anise Alcohol", "amylcinnamaldehyde": "Amyl Cinnamal", "alphaamylcinnamaldehyde": "Amyl Cinnamal",
         "cinnamicalcohol": "Cinnamyl Alcohol", "cinnamicaldehyde": "Cinnamal", "cinnamaldehyde": "Cinnamal",
         "hexylcinnamicaldehyde": "Hexyl Cinnamal", "hexylcinnamaldehyde": "Hexyl Cinnamal",
         "transanethole": "Anethole", "betacarophyllene": "Beta-Caryophyllene", "carophyllene": "Beta-Caryophyllene",
         "evernia furfuracea": "Evernia Furfuracea Extract", "treemoss": "Evernia Furfuracea Extract",
         "oakmoss": "Evernia Prunastri Extract", "rosek": "Rose Ketones",
         "2(4tbutylbenzyl)propionaldehyde": "Butylphenyl Methylpropional", "alphaisomethylionone": "Alpha-Isomethyl Ionone",
         "citrusaurantiumflower": "Citrus Aurantium Amara and Dulcis Flower Oil",
         "citrusaurantiumpeeloil": "Citrus Aurantium Amara and Dulcis Peel Oil", "citrusaurantiumpeel": "Citrus Aurantium Amara and Dulcis Peel Oil"}


def group_by_name(s):
    n = norm(s)
    if len(n) < 4:
        return None
    if n in ALIAS:
        return norm_to_g(ALIAS[n])
    best, bi = 0, None
    for i, g in enumerate(GNORM):
        r = difflib.SequenceMatcher(None, n, g).ratio()
        if r > best:
            best, bi = r, i
    return bi if best >= 0.84 else None


def norm_to_g(name):
    return GNORM.index(norm(name))


# ------------------------------------------------------------------ reading the PDF
UNITS = {"%", "ppm", "mg/kg", "mg/kg.", "mg/Kg"}
CMP = {"<", "≤", ">", "<=", "&lt;"}
NUM = re.compile(r"^([<≤>]|<=)?(\d+(?:[.,]\d+)?)(%|ppm|mg/kg)?$", re.I)
ND = re.compile(r"^(n\.?d\.?\*?|nd\*?|not|none)$", re.I)
DASH = re.compile(r"^-+$")


def rows_of(page):
    ws = sorted(page.get_text("words"), key=lambda w: ((w[1] + w[3]) / 2, w[0]))
    rows = []
    for w in ws:
        yc = (w[1] + w[3]) / 2
        if rows and abs(rows[-1]["y"] - yc) < 2.5:
            rows[-1]["w"].append([w[0], w[2], w[4]])
        else:
            rows.append({"y": yc, "w": [[w[0], w[2], w[4]]]})
    for r in rows:
        r["w"].sort()
    return rows


def vtokens(row):
    """Figure-like tokens of a row: merges '<' / '≤' with the number and the unit that follows."""
    w, out, i = row["w"], [], 0
    while i < len(w):
        x0, x1, t = w[i]
        cmp_ = None
        if t in CMP and i + 1 < len(w) and NUM.match(w[i + 1][2]):
            cmp_, x1n, tn = t, w[i + 1][1], w[i + 1][2]
            x1, t = x1n, tn
            i += 1
        m = NUM.match(t)
        if m:
            unit = m.group(3)
            c = cmp_ or m.group(1)
            j = i + 1
            if unit is None and j < len(w) and w[j][2] in UNITS and w[j][0] - x1 < 14:
                unit, x1 = w[j][2].rstrip("."), w[j][1]
                i = j
            raw = m.group(2)
            decimal = ("." in raw) or ("," in raw)
            out.append({"kind": "num", "x0": x0, "x1": x1, "raw": raw, "cmp": c, "unit": (unit or "").lower(),
                        "dec": decimal, "txt": ((c or "") + raw + (unit or ""))})
        elif DASH.match(t) or (ND.match(t)):
            out.append({"kind": "dash" if DASH.match(t) else "nd", "x0": x0, "x1": x1, "txt": t})
        i += 1
    return out


def cas_tokens(rows):
    out = []
    for ri, r in enumerate(rows):
        for x0, x1, t in r["w"]:
            for c in CAS_RE.findall(t):
                if cas_ok(c):
                    out.append({"ri": ri, "y": r["y"], "x0": x0, "cas": c})
    return out


def dec(raw):
    return Decimal(raw.replace(",", "."))


def fmt(d):
    if d is None:
        return ""
    s = format(d.normalize(), "f")
    return s


FAMILIAS = [  # (name, test on the text of the first two pages, note on the column taken)
    ("givaudan-compuesto", lambda t: "Total % in Perfume Compound" in t,
     "columna «Total % in Perfume Compound determined by calculation (Direct add and Indirect from naturals / synthetics)» (Givaudan): % calculado en el compuesto, no medido"),
    ("firmenich", lambda t: re.search(r"Direct", t) and re.search(r"Indir", t) and re.search(r"Presence of|Etiquetage", t),
     "columna «Total» del proveedor (Firmenich: adición directa + indirecta por naturales + indirecta por síntesis), % del producto; las columnas parciales no se usan"),
    ("firmenich-ppm", lambda t: re.search(r"Direct", t) and re.search(r"Indirect", t),
     "columna «Total» (directa + indirecta), % del producto"),
    ("givaudan", lambda t: "Maximum % in the substance" in t,
     "columna «Maximum % in the substance determined by GCMS analysis» (Givaudan): máximo medido por GC-MS en la sustancia, no un techo de especificación"),
    ("ventos", lambda t: "Total content (w/w)" in t, "columna «Total content (w/w)» (Ventós)"),
    ("pcw", lambda t: "pcwfrance.com" in t or t.lstrip().startswith("PCW"), "columna «%» de la declaración PCW, que lista solo lo presente; puede aparecer también fuera de la sección de alérgenos (C.M.R., etc.)"),
    ("robertet", lambda t: "LISTE ETENDUE" in t, "columna «%» de la lista extendida (Robertet)"),
    ("iff-presencia", lambda t: "Content (% w/w) in" in t, "columna «Content (% w/w) in IFF product»"),
    ("iff-extendida", lambda t: "Total Quantity" in t, "columna «Total Quantity (% w/w)» (IFF/LMR)"),
    ("iff-declaracion", lambda t: "%Natural" in t, "columna «% Total» (suma de «% Natural» y «% Synthetic»)"),
    ("symrise-clichy", lambda t: "Concentration total" in t or "Concentration" in t and "Annex" in t and "INCI" in t,
     "columna «Concentration total (%)»"),
    ("bedoukian", lambda t: "Quantity" in t and "Unit of" in t, "columna «Quantity Detected» con su unidad (mg/kg convertido a %: /10000)"),
    ("biolandes", lambda t: "N°Ordre" in t or ("ALLERGEN DECLARATION" in t and "Composants" in t), "columna «%» de la declaración de alérgenos (Biolandes)"),
    ("takasago", lambda t: "Reference" in t and "Chemically" in t, "columna «Concentration»"),
    ("moellhausen", lambda t: "Quantity (w/w)" in t, "columna «Quantity (w/w)», calculada de la fórmula (no medida)"),
    ("oleolio", lambda t: "REPORTED (%)" in t, "columna «REPORTED (%)» (Oleolio)"),
    ("v0", lambda t: "Concentration" in t and "measured" in t, "columnas «%» y «ppm»: se toma «%»"),
]


def family(text):
    for n, f, note in FAMILIAS:
        if f(text):
            return n, note
    return "otro", "formato sin clasificar; columna de cifras a la derecha del CAS"


# ------------------------------------------------------------------ statements without a table
NONE_RE = re.compile(r"does not contain any allergens|contains no compounds or allergens|none of the potential fragrance allergens"
                     r"|no correlation[/ a-z]*with the listed|not expect these materials", re.I)
IMPURITY_RE = re.compile(r"relation to the fragrance\s+allergen\s+(.+?)\s*\(CAS#\s*([\d-]+)\).{0,160}?maximum content of\s*([\d.,]+)\s*%", re.I | re.S)


def statement_text(path):
    """Plain text with pdftotext (some of these PDFs give no words to PyMuPDF)."""
    import subprocess
    r = subprocess.run(["pdftotext", "-layout", "-enc", "UTF-8", path, "-"], capture_output=True)
    return r.stdout.decode("utf-8", "replace")



def narrative_entries(stmt):
    """Figures given in prose instead of a table (two Bedoukian letters, one DSM statement)."""
    t = re.sub(r"\s+", " ", stmt)
    out = []

    def add(name, cas, raw, cmp_, unit, quote, spec):
        gi = CAS2G.get(cas)
        if gi is None:
            gi = ("cas", cas)
        out.append({"g": gi, "how": "cas-en-la-fila", "row_cas": [cas], "nm": name, "p": 1, "line": quote[:200], "spec": spec, "prosa": True,
                    "v": {"raw": raw, "cmp": cmp_, "unit": unit, "txt": (cmp_ or "") + raw + unit}})

    # Bedoukian: «with the exception of X (CAS n), Y (CAS n) and Z (CAS n)»
    m = re.search(r"with the exception of (.+?)\. (?=[A-Z0-9])", t)
    if m:
        ex = re.findall(r"([A-Za-z][A-Za-z ()-]*?)\s*\(CAS\s*#?\s*(\d+-\d+-\d)\)", m.group(1))
        upto = re.findall(r"up to (\d+)\s*ppm\s*\(\s*([\d.,]+)\s*%\s*\)", t)
        rest = []
        for name, cas in ex:
            name = name.strip(" ,").removeprefix("and ").strip()
            mm = re.search(r"(\d+)\s*ppm\s+" + re.escape(name.split()[0]) + r"[^.]*?was reported to be present", t, re.I)
            if mm:
                add(name, cas, mm.group(1), None, "ppm", mm.group(0), False)
            else:
                rest.append((name, cas))
        for (name, cas), (ppm, pc) in zip(rest, upto):
            add(name, cas, pc.replace(",", "."), "≤", "", "less than the detection limit but known impurity, up to %s ppm (%s%%)" % (ppm, pc), True)
    # DSM: «Linalool   Max 0,01 %   ...   Yes/No»
    if "below-mentioned potential fragrance" in t:
        for name, val, unit in re.findall(r"\b([A-Z][a-z]+(?: [A-Za-z]+)?) Max (\d+(?:[.,]\d+)?) ?(%|ppm)", t):
            g = group_by_name(name)
            if g is not None:
                cas = next(c for c in GROUPS[g][1])
                out.append({"g": g, "how": "nombre-en-la-fila", "row_cas": [], "nm": name, "p": 1, "spec": False, "prosa": True,
                            "line": "%s Max %s %s" % (name, val, unit), "v": {"raw": val, "cmp": "≤", "unit": unit if unit == "ppm" else "", "txt": "Max " + val + unit}})
    return out


# ------------------------------------------------------------------ reading a document
def read_doc(path, ifra):
    doc = pymupdf.open(path)
    text = "\n".join(p.get_text() for p in doc[:2])
    fam, note = family(text)
    info = {"familia": fam, "nota_col": note, "paginas": len(doc), "entries": [], "vistos": 0, "loq": 0,
            "sin_grupo": [], "fuera": [], "sin_ifra": 0, "declaracion_ninguno": False}
    info["declaracion"] = ""
    if len(text.strip()) < 80:
        text = statement_text(path)
        if len(text.strip()) < 80:
            info["estado"] = "sin-texto"
            return info
    stmt = statement_text(path)
    m = NONE_RE.search(re.sub(r"\s+", " ", stmt))
    if m:
        info["declaracion_ninguno"] = True
        i = max(0, m.start() - 60)
        info["declaracion"] = re.sub(r"\s+", " ", stmt)[i:m.end() + 40]
    mi = IMPURITY_RE.search(stmt)
    if mi:
        info["impureza"] = (re.sub(r"\s+", " ", mi.group(1)), mi.group(2), mi.group(3), re.sub(r"\s+", " ", mi.group(0))[:200])
    pages = [(rows_of(p)) for p in doc]
    allcas = [cas_tokens(r) for r in pages]
    flat = [c for l in allcas for c in l]
    # column of the CAS numbers and of the «Total»
    cas_x = statistics.quantiles([c["x0"] for c in flat], n=4)[0] if len(flat) >= 4 else (min([c["x0"] for c in flat]) if flat else 0)
    total_x = None
    for rows, cl in zip(pages, allcas):
        first = min([c["y"] for c in cl], default=1e9)
        for r in rows:
            if r["y"] >= first:
                break
            for x0, x1, t in r["w"]:
                if t == "Total" and total_x is None:
                    total_x = x0
    lims = collections.Counter()
    cand = []
    for pi, (rows, cl) in enumerate(zip(pages, allcas)):
        ys = [c["y"] for c in cl]
        ylo, yhi = (min(ys) - 14, max(ys) + 14) if ys else (1e9, -1e9)
        for ri, r in enumerate(rows):
            vt = vtokens(r)
            for k, v in enumerate(vt):
                centre = (v["x0"] + v["x1"]) / 2
                if total_x is not None:
                    if centre < total_x - 22:
                        continue
                else:
                    if v["x0"] < cas_x + 30:
                        continue
                    if any(o["x0"] > v["x1"] + 3 for o in vt[k + 1:] if o["kind"] in ("num", "dash", "nd")):
                        continue
                if not (ylo <= r["y"] <= yhi) and v["kind"] == "num" and not any(
                        c["ri"] == ri for c in cl):
                    continue
                if v["kind"] != "num":
                    info["vistos"] += 1
                    continue
                if not (v["dec"] or v["unit"] or v["cmp"]):
                    continue              # bare integer: page number, note index...
                info["vistos"] += 1
                if v["cmp"] in ("<", "<=") and v["unit"] in ("ppm", "mg/kg"):
                    info["loq"] += 1
                    continue
                cand.append((pi, ri, v))
                if v["cmp"] in ("<", "&lt;"):
                    lims[v["txt"]] += 1
    for pi, ri, v in cand:
        rows, cl = pages[pi], allcas[pi]
        if v["cmp"] in ("<", "&lt;") and lims[v["txt"]] >= 3:
            info["loq"] += 1                  # the same «< x» all down the table: detection limit
            continue
        r = rows[ri]
        row_cas = [c["cas"] for c in cl if c["ri"] == ri]
        gi, how = None, ""
        for c in row_cas:
            if c in CAS2G:
                gi, how = CAS2G[c], "cas-en-la-fila"
                break
        nm = " ".join(t for x0, x1, t in r["w"] if x1 <= v["x0"] + 1 and re.search(r"[A-Za-z]{2}", t) and not CAS_RE.search(t)
                      and not NUM.match(t) and not ND.match(t) and not t.startswith("CAS") and not t.startswith("(CAS")
                      and t.lower() not in ("several", "natural", "and", "impurity") and not re.match(r"^[IV]{1,3}(/[\d,]+)?$", t))
        if gi is None and nm:
            g = group_by_name(nm)
            if g is not None:
                gi, how = g, "nombre-en-la-fila"
        if gi is None and cl:
            near = min(cl, key=lambda c: (round(abs(c["y"] - r["y"])), c["y"] < r["y"]))
            if abs(near["y"] - r["y"]) <= 14 and near["cas"] in CAS2G:
                gi, how = CAS2G[near["cas"]], "cas-mas-cercano"
                row_cas = [near["cas"]]
        if gi is None:
            # a CAS that is not in the EU list but has an IFRA standard: keep it as itself
            for c in row_cas:
                if c in ifra:
                    gi, how = ("cas", c), "cas-en-la-fila"
                    break
        if gi is None and row_cas:
            info["fuera"].append(nm or row_cas[0])       # a substance that is not in the EU list and has no IFRA standard
            continue
        if gi is None:
            info["sin_grupo"].append("%s p%d y%.0f «%s» %s" % (v["txt"], pi + 1, r["y"], nm, row_cas))
            continue
        entry = {"g": gi, "how": how, "v": v, "row_cas": row_cas, "nm": nm, "p": pi + 1,
                 "line": re.sub(r"\s+", " ", " ".join(t for x0, x1, t in r["w"]))[:150]}
        if how == "cas-mas-cercano" or how == "nombre-en-la-fila":
            # the CAS lines around the row, for the quote
            entry["line"] = entry["line"] + " [CAS de la celda: " + " ".join(row_cas) + "]" if row_cas else entry["line"]
        info["entries"].append(entry)
    info["entries"].extend(narrative_entries(stmt))
    if info.get("impureza"):
        nm_, cas_, val_, q_ = info["impureza"]
        info["entries"].append({"g": ("cas", cas_), "how": "cas-en-la-fila", "row_cas": [cas_], "nm": nm_, "p": 1, "line": q_,
                                "v": {"raw": val_, "cmp": "≤", "unit": "", "txt": "maximum content of " + val_ + "%"}, "spec": True, "prosa": True})
    info["estado"] = "leida" if info["vistos"] >= 5 or info["entries"] or info["declaracion_ninguno"] or (fam == "pcw" and re.search(r"ALLERGENS", text)) else "no-parseada"
    return info


# ------------------------------------------------------------------ main
def pct(v):
    """(min, max, tipo, nota) of a figure token, in % of the product."""
    d = dec(v["raw"])
    nota = ""
    if v["unit"] in ("ppm", "mg/kg"):
        d = d / 10000
        nota = "cifra en %s convertida a %% (/10000)" % v["unit"]
    if v["cmp"] in ("<", "≤", "<=", "&lt;"):
        return None, d, "máximo", nota
    if v["cmp"] == ">":
        return d, None, "rango", (nota + "; " if nota else "") + "la lista da una cota inferior («>%s»): el valor real es mayor" % v["raw"]
    return d, d, "típico", nota


def main():
    pages, pdf_pages, mats, by_cas, name_idx, ifra = load_catalogue()
    # page files whose name lost a symbol of the URL (orbitone®-t -> orbitone_-t): match them by normalised name
    from urllib.parse import unquote
    nk = lambda k: re.sub(r"[^a-z0-9]+", "_", unquote(k).lower()).strip("_")
    bynorm = {nk(k): k for k in pages}
    rescued = 0
    for plist in pdf_pages.values():
        for p in plist:
            if p not in pages and nk(p) in bynorm:
                pages[p] = pages[bynorm[nk(p)]]
                rescued += 1
    diag0 = json.load(open(os.path.join(LOTES, "C-002-diagnostico.json"), encoding="utf-8"))
    docs = sorted(diag0["alergenos"])
    rowsC, rowsS = [], []
    diag = {"docs": {}, "sin_pagina": [], "no_parseada": [], "sin_texto": [], "sin_grupo": {}, "familias": collections.Counter(),
            "fuera_de_ifra": collections.Counter(), "propio_omitido": 0}
    seen = set()
    for d in docs:
        path = os.path.join(DOCS, d)
        if not os.path.exists(path):
            diag["sin_texto"].append(d)
            continue
        try:
            info = read_doc(path, ifra)
        except Exception as e:  # corrupt PDF
            diag["no_parseada"].append("%s [%s]" % (d, e))
            continue
        diag["familias"][info["familia"]] += 1
        if info["estado"] == "sin-texto":
            diag["sin_texto"].append(d)
            continue
        if info["estado"] == "no-parseada":
            diag["no_parseada"].append("%s [%s]" % (d, info["familia"]))
            continue
        if info["sin_grupo"]:
            diag["sin_grupo"][d] = info["sin_grupo"]
        pgs = pdf_pages.get(d, [])
        if not pgs:
            diag["sin_pagina"].append(d)
            continue
        for p in pgs:
            m, note = resolve_material(p, pages, by_cas, name_idx)
            r = pages.get(p)
            own = m["cas"] if m else (r["cas"] if r else "")
            own_set = {own} | set(c.strip() for c in ((m["otros_cas"] if m else "") or "").replace(";", "|").split("|") if c.strip())
            out = rowsC if m else rowsS
            base = {"material_id": m["id"] if m else "", "cas": own, "nombre": (m["nombre"] if m else (r["nombre"] if r else p)),
                    "fuente": "Perfumiarz: lista de alérgenos %s" % d, "tipo_fuente": "proveedor",
                    "url": "https://perfumiarz.com/products/" + p, "consultado": TODAY}
            extra = "" if m else note
            n_rows, got = 0, {}
            for e in info["entries"]:
                g = e["g"]
                if isinstance(g, tuple):
                    gname, gcas = (by_cas[g[1]][0]["nombre"] if by_cas.get(g[1]) else g[1]), [g[1]]
                else:
                    gname, gcas = GROUPS[g]
                if own_set & set(gcas):
                    diag["propio_omitido"] += 1
                    continue
                pick = next((c for c in e["row_cas"] if c in ifra and c in gcas), None) or next((c for c in gcas if c in ifra), None)
                if pick is None:
                    diag["fuera_de_ifra"][gname] += 1
                    continue
                lo, hi, tipo, n1 = pct(e["v"])
                key = (base["material_id"] or p, d, gname, lo, hi)
                if key in seen:
                    continue
                seen.add(key)
                prev = got.get(gname)
                notas = ["cifra tomada del texto de la declaración, no de una tabla"] if e.get("prosa") else [info["nota_col"]]
                if n1:
                    notas.append(n1)
                if e.get("spec"):
                    notas.append("límite de especificación del proveedor para una impureza conocida (la lista no trae medida), no un valor medido")
                if tipo == "máximo" and not e.get("spec"):
                    notas.append("la lista da un tope («%s»), no un valor típico" % e["v"]["txt"])
                if e["how"] == "cas-mas-cercano":
                    notas.append("cifra de una celda con varios CAS, emparejada con el grupo del CAS más cercano")
                if e["how"] == "nombre-en-la-fila":
                    notas.append("emparejada por el nombre del alérgeno (el CAS va en otra línea de la celda)")
                if prev is not None:
                    notas.append("el mismo alérgeno sale con otra cifra en otra parte de la lista (%s)" % prev)
                got.setdefault(gname, fmt(hi))
                if extra:
                    notas.append(extra)
                out.append(dict(base, constituyente=gname, cas_constituyente=pick, estandar_ifra=";".join(ifra[pick]),
                                min_pct=fmt(lo), max_pct=fmt(hi), tipo_valor=tipo, cita=e["line"][:200],
                                notas="; ".join(notas)))
                n_rows += 1
            if n_rows == 0:
                n = []
                if info["loq"]:
                    n.append("las demás cifras son «< límite de cuantificación» (%d)" % info["loq"])
                n.append("la lista no declara ningún alérgeno con estándar IFRA" + (" distinto del propio producto" if own_set and any(
                    (not isinstance(e["g"], tuple)) and own_set & set(GROUPS[e["g"]][1]) for e in info["entries"]) else ""))
                if info["declaracion_ninguno"]:
                    n.append("el documento es una declaración sin cifras («%s»)" % info["declaracion"][:150])
                if extra:
                    n.append(extra)
                out.append(dict(base, constituyente="", cas_constituyente="", estandar_ifra="", min_pct="", max_pct="",
                                tipo_valor="sin-cifra", cita="", notas="; ".join(n)))
        diag["docs"][d] = {"familia": info["familia"], "entradas": len(info["entries"]), "vistos": info["vistos"],
                           "como": dict(collections.Counter(e["how"] for e in info["entries"]))}
    for name, rows in (("C-003.csv", rowsC), ("C-003-sin-glosario.csv", rowsS)):
        with open(os.path.join(LOTES, name), "w", encoding="utf-8", newline="\n") as fh:
            w = csv.DictWriter(fh, fieldnames=COLS, lineterminator="\n")
            w.writeheader()
            w.writerows(rows)
    diag["familias"] = dict(diag["familias"])
    diag["fuera_de_ifra"] = dict(diag["fuera_de_ifra"])
    diag["_filas"] = {"C-003": len(rowsC), "C-003-sin-glosario": len(rowsS)}
    json.dump(diag, open(os.path.join(LOTES, "C-003-diagnostico.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(json.dumps({k: (v if not isinstance(v, (list, dict)) or len(v) < 15 else len(v)) for k, v in diag.items() if k != "docs"}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
