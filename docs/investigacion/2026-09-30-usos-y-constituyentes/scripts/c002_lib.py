# -*- coding: utf-8 -*-
"""Shared helpers for the C-002 batch (Perfumiarz SDS + IFRA certificates)."""
import csv, glob, os, re, collections

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), *[".."] * 4))
# the PDFs live in the main checkout, not in the worktree
MAIN = r"C:\Users\SERGI\Claude\Projects\perfumeria-app"
CACHE = os.path.join(MAIN, "datos", "glosario", ".cache", "proveedores", "perfumiarz")
TODAY = "2026-09-30"


# ---------------------------------------------------------------- catalogue
def load_catalogue():
    """Return (pages, pdf_pages, materials, by_cas, name_idx, ifra)."""
    rows = list(csv.DictReader(open(os.path.join(REPO, "datos/glosario/origen/nombres-proveedores.csv"), encoding="utf-8")))
    pages = {r["url"].rsplit("/", 1)[1]: r for r in rows if r["proveedor"] == "Perfumiarz"}
    pdf_pages = collections.defaultdict(list)
    for f in sorted(glob.glob(os.path.join(CACHE, "paginas", "*.html"))):
        h = open(f, encoding="utf-8").read()
        for l in sorted(set(re.findall(r'files/([^"?]+\.pdf)', h))):
            pdf_pages[l].append(os.path.basename(f)[:-5])
    mats = list(csv.DictReader(open(os.path.join(REPO, "datos/glosario/materiales.csv"), encoding="utf-8")))
    by_cas = collections.defaultdict(list)
    name_idx = collections.defaultdict(list)
    for m in mats:
        by_cas[m["cas"]].append(m)
        for c in (m["otros_cas"] or "").replace(";", "|").split("|"):
            if c.strip():
                by_cas[c.strip()].append(m)
        for n in (m["nombres_proveedores"] or "").split(" | "):
            if n.strip():
                name_idx[n.strip().lower()].append(m)
    ifra = collections.defaultdict(list)
    for r in csv.DictReader(open(os.path.join(REPO, "datos/ifra/51/estandar-cas.csv"), encoding="utf-8")):
        if r["estandar"] not in ifra[r["cas"]]:
            ifra[r["cas"]].append(r["estandar"])
    return pages, pdf_pages, mats, by_cas, name_idx, ifra


def resolve_material(page, pages, by_cas, name_idx):
    """Map a Perfumiarz page to a glossary row. Returns (material|None, note)."""
    r = pages.get(page)
    if r is None:
        return None, "sin fila en nombres-proveedores (producto sin CAS)"
    cands = by_cas.get(r["cas"], [])
    seen = set(); cands = [m for m in cands if not (m["id"] in seen or seen.add(m["id"]))]
    if not cands:
        return None, "CAS %s sin fila en el glosario" % r["cas"]
    if len(cands) == 1:
        return cands[0], ""
    byname = [m for m in cands if m in name_idx.get(r["nombre"].strip().lower(), [])]
    if len(byname) == 1:
        return byname[0], ""
    pool = byname or cands
    tipo = {"co2": "extract"}.get(r["tipo"], r["tipo"])
    if r["clase"] in ("natural", "molécula"):
        p2 = [m for m in pool if m["clase"] == r["clase"]]
        pool = p2 or pool
    if tipo:
        p2 = [m for m in pool if m["tipo_natural"] == tipo]
        pool = p2 or pool
    if len(pool) == 1:
        return pool[0], ""
    return None, "forma ambigua, candidatas: " + ", ".join(m["id"] for m in pool[:8])


# ---------------------------------------------------------------- CAS
def cas_ok(s):
    d = s.replace("-", "")
    return sum(int(c) * i for i, c in enumerate(reversed(d[:-1]), 1)) % 10 == int(d[-1])


CAS_RE = re.compile(r"(?<![\d-])(\d{2,7}-\d{2}-\d)(?![\d-])")


def cas_in(s):
    return [c for c in CAS_RE.findall(s) if cas_ok(c)]


# ---------------------------------------------------------------- classification
def read_txt(txtdir, name):
    p = os.path.join(txtdir, name + ".txt")
    return open(p, encoding="utf-8", errors="replace").read() if os.path.exists(p) else ""


def classify(name, t):
    """imagen | ifra | sds | alergenos | otro, from the content (the file names lie)."""
    head = t[:4000]
    if len(t.strip()) < 50:
        return "imagen"
    sds_head = re.search(r"SAFETY DATA SHEET|SECTION 1|Material security|Safety Data Sheet|FICHE DE DONN|KARTA CHARAKT|BEZPE|KARTA BEZPE|1\.\s*(PRODUCT|IDENTIFICATION)", t[:2500], re.I)
    if re.search(r"IFRA", t[:3000], re.I) and re.search(r"certif|conformity|complies|compliance|IFRA 51|IFRA-51", head, re.I) and not sds_head:
        return "ifra"
    if re.search(r"allergen|alergen", t[:2500], re.I) and not sds_head:
        return "alergenos"
    if sds_head or re.search(r"\bFDS", name):
        return "sds"
    # fallback on the file name, for the few whose first page has none of the usual headings
    if re.search(r"_ALG_|Lista_alerg|Allergen", name, re.I):
        return "alergenos"
    if re.search(r"^SDS|_SDS|karta_charakter|SON\d", name, re.I) and re.search(r"CAS|composition|hazard|H\d{3}", t, re.I):
        return "sds"
    return "otro"


# ---------------------------------------------------------------- SDS section 3
HEAD3 = re.compile(r"^\s*(?:\|>)?\s*(?:SECTION|SEKCJA|ODDIEL|SEKCIA|SECTION)?\s*3\s*[.:)]\s*\S", re.I)
HEAD4 = re.compile(r"^\s*(?:\|>)?\s*(?:SECTION|SEKCJA|ODDIEL|SEKCIA)?\s*4\s*[.:)]\s*\S", re.I)
KW3 = re.compile(r"compos|sk[lł]ad|zlo[zž]enie|slo[zž]en|zusammens|composici|ingredient", re.I)


def section3(t):
    lines = t.split("\n")
    start = None
    for i, l in enumerate(lines):
        if HEAD3.match(l) and KW3.search(l):
            start = i
            break
    if start is None:
        return None
    end = len(lines)
    for j in range(start + 1, len(lines)):
        if HEAD4.match(lines[j]):
            end = j
            break
    return lines[start:end]


NUM = r"\d+(?:[.,]\d+)?"
PCT_PATTERNS = [
    # Givaudan / CLP:  >= 20 - < 30
    ("banda", re.compile(r"(?:>=|≥)\s*(%s)\s*-\s*<\s*(%s)" % (NUM, NUM))),
    # IFF "1; <10"  (>=1 and <10)
    ("banda", re.compile(r"(?<![\d.,])(%s)\s*;\s*<\s*(%s)" % (NUM, NUM))),
    ("max", re.compile(r"(?:<=|≤|&lt;=)\s*(%s)\s*%%?" % NUM)),
    ("rango", re.compile(r"(?<![\d.,])\[?\s*(%s)\s*[-–]\s*(%s)\s*%%?\s*\]?" % (NUM, NUM))),
    ("mayor", re.compile(r">\s*(%s)\s*%%" % NUM)),
    ("menor", re.compile(r"<\s*(%s)\s*%%" % NUM)),
    ("unico", re.compile(r"(?<![\d.,-])(%s)\s*%%" % NUM)),
]
BAD_LINE = re.compile(r"ATE\b|mg/kg|M Acute|M Chronic|\bH\d{3}\b|EUH|LD50|LC50|\bEC:?\s*\d|EINECS|EC-No|REACH|Index|\bNote\b", re.I)


def f(x):
    return float(x.replace(",", "."))


def parse_pct(s):
    """Return (min,max,tipo,raw) or None for the first concentration token in s."""
    for kind, rx in PCT_PATTERNS:
        m = rx.search(s)
        if not m:
            continue
        raw = m.group(0).strip()
        if kind == "max":
            return (None, f(m.group(1)), "máximo", raw)
        if kind in ("banda", "rango"):
            a, b = f(m.group(1)), f(m.group(2))
            if a > b:
                continue
            return (a, b, "rango", raw)
        if kind == "mayor":
            return (f(m.group(1)), None, "rango", raw)
        if kind == "menor":
            return (None, f(m.group(1)), "máximo", raw)
        return (f(m.group(1)), f(m.group(1)), "típico", raw)
    return None


PAGE_BREAK = re.compile(r"Page\s+\d+\s*/\s*\d+|Strana\s+\d+\s*/\s*\d+|Strona\s+\d+\s*/\s*\d+|Seite\s+\d+\s*/\s*\d+|InfoDyne|^\s*\d+\s*/\s*\d+\s*$", re.I)
TOK = r"(?:>=|≥|<=|≤|>|<)?\s*\d+(?:[.,]\d+)?(?:\s*(?:-|–|;)\s*(?:<\s*)?\d+(?:[.,]\d+)?)?\s*%?"
EOL_TOK = re.compile(r"\s{3,}(\[?\s*%s\s*\]?)\s*$" % TOK)
XBAND = re.compile(r"(%s)\s*[≤<]=?\s*x\s*[<≤]=?\s*(%s)" % (NUM, NUM))
SKIP_TOK = re.compile(r"ATE\b|mg/kg|LD50|LC50|Acute\s*=|Chronic\s*=|M-factor|ppm|mg/m", re.I)


def pages_of(sec):
    parts, cur = [], []
    for l in sec:
        if PAGE_BREAK.search(l):
            if cur:
                parts.append(cur)
            cur = []
        else:
            cur.append(l)
    if cur:
        parts.append(cur)
    return parts


def constituents(sec, own_cas):
    """Constituents of section 3 with a verifiable concentration.

    Returns (rows, method, unresolved_cas); rows = [(cas, pct, line)].
    The tables of these SDS do not keep the % on the CAS line, but the columns keep the
    order. Per PDF page we pair the n-th CAS with the n-th % of the column, and only when
    the page has as many CAS as % tokens; if the CAS line carries its own %, it must be
    the one paired.
    """
    rows, unres = [], []
    for part in pages_of(sec):
        uniq = []
        for l in part:
            cs = cas_in(l)
            if cs and re.search(r"CAS|\d{2,7}-\d{2}-\d", l):
                c = cs[0]
                if c not in [u[0] for u in uniq]:
                    uniq.append((c, l))
        if not uniq:
            continue
        toks = []
        for l in part:
            if SKIP_TOK.search(l):
                continue
            mx = XBAND.search(l)
            if mx:
                toks.append(((f(mx.group(1)), f(mx.group(2)), "rango", mx.group(0).strip()), l))
                continue
            m = EOL_TOK.search(l)
            if not m:
                continue
            tk = m.group(1).strip()
            if re.fullmatch(r"\[\s*\d+\s*\]", tk):
                continue
            p = parse_pct(tk if ("%" in tk or re.search(r"[-–;<>=≥≤]", tk)) else tk + " %")
            if p:
                toks.append((p, l))
        if len(toks) != len(uniq):
            unres.extend(c for c, _ in uniq)
            continue
        ok, paired = True, []
        for (c, cl), (p, tl) in zip(uniq, toks):
            same = cl is tl
            if not same and EOL_TOK.search(cl):
                ok = False
            paired.append((c, p, tl.strip() if same else cl.strip() + "  ||  " + tl.strip()))
        if not ok:
            unres.extend(c for c, _ in uniq)
            continue
        rows.extend(paired)
    if rows:
        return rows, "orden-por-pagina", unres
    return [], "no-alineable", unres
