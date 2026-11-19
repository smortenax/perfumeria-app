"""Tanda 61: de lo leído en la web (web-61-*.csv, y las dosis que ya leyó la tanda 60), la propuesta para
completar los rezagados y dar uso habitual a los comunes de las tandas 57 y 60.

    python3 -I migracion-v3/web/info-61/consolidar.py   → propuesta-61.csv, dosis-61.csv, no-usado-61.csv

Las reglas de las tandas 46, 47 y 60 (normalizar.choose) para familia, horas y fuerza, y una más firme:
**cada frase entre «» tiene que estar en la página guardada** (pagina.py, cache/). La que no está, no entra.

El uso habitual, por V3-105 (el usuario, 2026-11-19: «acepta las dosis de otras referencias»): la cifra de
cualquier referencia, con su base si la frase la dice; un rango da mínimo y máximo, una mediana da el
típico. Una fila por referencia (como mucho tres), sin elegir entre ellas: el uso varía de una casa a otra.
"""
import csv, json, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(HERE.parent / "completar-comunes"))
sys.path.insert(0, str(HERE))
from normalizar import choose, rank, site  # noqa: E402
from pagina import fetch, normal, text_of  # noqa: E402

OTHER = re.compile(r"otro CAS|CAS de la página \S+,? no|no coincide|otra especie|otro proceso|otra parte|otro grado|otro producto|otra forma|parecido|no idéntic", re.I)
DILUTED = re.compile(r"diluid|al \d+ ?% en (dpg|ipm|tec|alcohol|etanol)|\d+ ?% en (dpg|ipm|tec|alcohol|etanol)|tintura al|tincture \d+ ?%|\d+ ?% tincture", re.I)
QUOTE = re.compile(r"«(.+?)»", re.S)

lista = list(csv.DictReader(open(HERE / "lista.csv", encoding="utf-8")))
materials = {r["id"]: r for r in csv.DictReader(open(ROOT / "v3/datos/materials.csv", encoding="utf-8"))}

reads = {}
for path in sorted(HERE.glob("web-61-*.csv")):
    for r in csv.DictReader(open(path, encoding="utf-8")):
        r["lote"] = path.name
        reads.setdefault((r["n"].strip(), r["campo"].strip()), []).append(r)
# Las dosis que ya leyó la tanda 60, por el id de su material.
by_id = {x["material_id"]: x["n"] for x in lista}
ids60 = {r["n"]: r["id"] for r in csv.DictReader(open(HERE.parent / "info-18-nov/lista.csv", encoding="utf-8"))}
for i in range(5):
    for r in csv.DictReader(open(HERE.parent / f"info-18-nov/web-60-0{i}.csv", encoding="utf-8")):
        if r["campo"] == "dosis" and r["valor"].strip():
            mid = ids60.get(r["n"]) or ("" if not r["n"].startswith("maese-") else next((m for m, v in materials.items() if "tanda57:maese:461" in "" ), ""))
            n = by_id.get(mid)
            if n is None and mid and mid in materials:
                n = f"60:{mid}"
            if n:
                r["lote"] = f"web-60-0{i}.csv"
                reads.setdefault((n, "dosis"), []).append(r)

checked = {}


def literal(r):
    """Whether each «phrase» of the row's source is in the page it names (the cached copy)."""
    m = re.match(r"\s*[^,]+,\s*(https?://\S+?):\s*«", r["fuente"])
    if not m:
        return False, "sin URL o sin frase"
    url = m.group(1)
    if url not in checked:
        checked[url] = normal(text_of(fetch(url)))
    page = checked[url]
    if page.startswith("<!-- http"):
        return False, "la página no se pudo leer"
    phrases = QUOTE.findall(r["fuente"])
    missing = [p for p in phrases if normal(p) not in page]
    return (not missing), ("" if not missing else f"la frase «{missing[0][:80]}» no está en la página")


NUM = r"(\d+(?:[.,]\d+)?)"


def dose_of(text):
    """(min, typical, max, basis) as fractions, from a dose phrase; None without a figure."""
    t = text.replace("–", "-").replace("—", "-").lower()
    if not re.search(NUM + r"\s*%", t):
        return None
    f = lambda s: float(s.replace(",", ".")) / 100
    basis = ("concentrate" if re.search(r"concentrate|fragrance compound|compound|of the formula|in the formula|perfume oil|fragrance oil", t) else
             "finished_product" if re.search(r"finished|fine fragrance|in the product|eau de|edp|edt|final product", t) else "undeclared")
    med = re.search(r"median(?: of| use)?(?: at)?\s*" + NUM + r"\s*%", t)
    if med:
        return None, f(med.group(1)), None, basis
    ranges = re.findall(NUM + r"\s*%?\s*(?:-|to|a|–)\s*" + NUM + r"\s*%", t)
    if ranges:
        lo = min(f(a) for a, _ in ranges)
        hi = max(f(b) for _, b in ranges)
        return (lo, None, hi, basis) if lo < hi else (None, None, hi, basis)
    up = re.search(r"(?:up to|max(?:imum)?|traces? to|trace to|no more than|below|under)\s*" + NUM + r"\s*%", t)
    if up:
        return None, None, f(up.group(1)), basis
    one = re.findall(NUM + r"\s*%", t)
    return (None, f(one[0]), None, basis) if len(one) == 1 else None


out, doses, dropped = [], [], []
for x in lista + [{"n": n, "material_id": n[3:], "nombre": materials[n[3:]]["name"], "buscar": "dosis", "parte": "dosis 60"} for n in sorted({k[0] for k in reads if k[0].startswith("60:")})]:
    n, mid = x["n"], x["material_id"]
    m = materials[mid]
    want = x["buscar"].split()

    def keep(campo, cifra):
        good = []
        for r in reads.get((n, campo), []):
            if not r["valor"].strip():
                continue
            ok, why = literal(r)
            if not ok:
                dropped.append({"n": n, "nombre": m["name"], "campo": campo, "valor": r["valor"], "motivo": why, "fuente": r["fuente"]})
                continue
            if OTHER.search(r["nota"]) or (cifra and DILUTED.search(r["nota"])):
                dropped.append({"n": n, "nombre": m["name"], "campo": campo, "valor": r["valor"], "motivo": r["nota"], "fuente": r["fuente"]})
                continue
            good.append(r)
        return good

    row = {"n": n, "id": mid, "nombre": m["name"], "buscar": " ".join(want)}
    tincture = "tincture" in m["name"].lower()
    for campo, field in (("familia", "family"), ("horas", "tenacity_hours"), ("fuerza", "strength")):
        value, first, disputed, otras, regla = choose(campo, keep(campo, campo != "familia"), tincture=tincture) if campo in want and not m.get(field) else (None, None, False, "", "")
        row[field] = value or ""
        row[field + "_fuente"] = first["fuente"] if value else ""
        row[field + "_disputado"] = "si" if value and disputed else ""
        row[field + "_otras"] = otras if value else ""
    for campo, field, pattern in (("casa", "house", None), ("cas", "cas", r"\d{2,7}-\d\d-\d"), ("especie", "species", None)):
        good = sorted([r for r in keep(campo, False) if not pattern or re.fullmatch(pattern, r["valor"].strip())], key=lambda r: rank(r["fuente"]))
        values = {r["valor"].strip().lower() for r in good}
        row[field] = good[0]["valor"].strip() if good and campo in want and not m.get(field) else ""
        row[field + "_fuente"] = good[0]["fuente"] if row[field] else ""
        row[field + "_disputado"] = "si" if row[field] and len(values) > 1 else ""
    row["olores"] = json.dumps([[site(r["fuente"]), r["valor"].strip(), r["fuente"]] for r in keep("olor", False)] if "olor" in want else [], ensure_ascii=False)
    got = 0
    # A tincture's use, only from a page of a tincture at an unstated or the same strength: Fraterworks' cinnamon is «Tincture 25%», another product.
    tincture_dose = lambda r: not tincture or (re.search(r"tintura|tincture", r["fuente"] + r["nota"], re.I) and not DILUTED.search(r["fuente"] + " " + r["nota"]))
    for r in sorted([r for r in keep("dosis", True) if tincture_dose(r) or dropped.append({"n": n, "nombre": m["name"], "campo": "dosis", "valor": r["valor"], "motivo": "uso de otra tintura u otra forma", "fuente": r["fuente"]})], key=lambda r: rank(r["fuente"])):
        d = dose_of(" ".join(QUOTE.findall(r["fuente"])) or r["valor"])
        if not d or got == 3:
            if not d:
                dropped.append({"n": n, "nombre": m["name"], "campo": "dosis", "valor": r["valor"], "motivo": "sin cifra que leer", "fuente": r["fuente"]})
            continue
        got += 1
        lo, typ, hi, basis = d
        doses.append({"n": n, "id": mid, "nombre": m["name"], "min": "" if lo is None else f"{lo:.6g}", "typical": "" if typ is None else f"{typ:.6g}",
                      "max": "" if hi is None else f"{hi:.6g}", "basis": basis, "fuente": r["fuente"], "nota": r["nota"]})
    row["dosis"] = str(got)
    out.append(row)

for name, rows in (("propuesta-61.csv", out), ("dosis-61.csv", doses), ("no-usado-61.csv", dropped)):
    with open(HERE / name, "w", encoding="utf-8", newline="") as f:
        cols = list(rows[0]) if rows else ["n"]
        w = csv.DictWriter(f, fieldnames=cols, lineterminator="\n")
        w.writeheader(); w.writerows(rows)
print(f"{len(out)} materiales; {sum(bool(r['family']) for r in out)} familias, {sum(bool(r['tenacity_hours']) for r in out)} horas, "
      f"{sum(bool(r['strength']) for r in out)} fuerzas, {sum(bool(r['house']) for r in out)} casas, {len(doses)} usos en "
      f"{len({d['id'] for d in doses})} materiales; {len(dropped)} lecturas no usadas.")
