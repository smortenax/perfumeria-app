"""Tanda 64: de lo leído (TGSC por script, web-64-tgsc.csv; y los documentos de fuera, documentos-64.csv),
la propuesta para completar los 55 del pedido de Perfumiarz del 19-nov.

    python3 -I migracion-v3/web/info-64/consolidar.py
      → propuesta-64.csv, dosis-64.csv, fisico-64.csv, olores-64.csv, distintos-64.csv, no-usado-64.csv

Solo llena campos vacíos: lo que ya tenía valor no cambia; si TGSC da otro valor, va a distintos-64.csv
para que lo mires. Cada frase entre «» tiene que estar en la página guardada (como en la tanda 61).
- Familia, fuerza: la palabra de TGSC llevada al vocabulario de la app (normalizar, tandas 46 a 63).
- Horas: «Substantivity: N hour(s) at 100.00 %»; a otra concentración no vale.
- Uso (V3-105): «usage levels up to: X % in the fragrance concentrate», máximo con base concentrado; no
  entra si el material ya tiene un uso de TGSC.
- Físicos: aspecto, densidad (la primera cifra de «Specific Gravity»), solubilidad, peso molecular, fórmula,
  presión de vapor, punto de fusión (solo una cifra, no un rango).
"""
import csv, json, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(HERE.parent / "completar-comunes"))
sys.path.insert(0, str(HERE.parent / "info-61"))
from normalizar import family as family_word, hours, same_hours, strength  # noqa: E402

# Palabras de TGSC que normalizar no lee (lectura de la sesión, por los «covers» de family_palette.csv):
# melón, fruta; café, tostado (transformed: «roasted (pyrazines)… sulphurous»); chocolate y coco, gourmand.
MORE = {"melon": "fruity", "coffee": "transformed", "chocolate": "gourmand", "coconut": "gourmand"}
family = lambda v: family_word(v) or MORE.get(v.strip().lower())
from pagina import fetch, normal, text_of  # noqa: E402

rd = lambda p: list(csv.DictReader(open(p, encoding="utf-8")))
lista = rd(HERE / "lista.csv")
D = ROOT / "v3/datos"
materials = {m["id"]: m for m in rd(D / "materials.csv")}
tg_doses = {d["material_id"] for d in rd(D / "material_doses.csv") if "thegoodscents" in d["source"].lower()}
tg_desc = {d["material_id"] for d in rd(D / "material_descriptors.csv") if d["text"].startswith("TGSC") or d["source"] == "TG"}
reads = {}
for r in rd(HERE / "web-64-tgsc.csv"):
    reads.setdefault(r["n"], []).append(r)

QUOTE = re.compile(r"«(.+?)»", re.S)
checked = {}


def literal(r):
    m = re.match(r"\s*[^,]+,\s*(https?://\S+?):\s*«", r["fuente"])
    if not m:
        return False, "sin URL o sin frase"
    url = m.group(1)
    if url not in checked:
        checked[url] = normal(text_of(fetch(url)))
    missing = [p for p in QUOTE.findall(r["fuente"]) if normal(p) not in checked[url]]
    return not missing, "" if not missing else f"la frase «{missing[0][:80]}» no está en la página"


def num(s):
    m = re.search(r"-?\d+(?:\.\d+)?", s)
    return m.group(0) if m else None


props, doses, phys, odors, differ, dropped = [], [], [], [], [], []
done = set()
for x in lista:
    n, mid = x["n"], x["material_id"]
    if mid in done:  # Ambrox DL, Ambroxan and Ambrox Super are all the common Ambermor (batch 57): once
        continue
    done.add(mid)
    m = materials[mid]
    got = {}
    for r in reads.get(n, []):
        if not r["valor"]:
            dropped.append({"n": n, "nombre": m["name"], "campo": r["campo"], "valor": "", "motivo": r["nota"], "fuente": r["fuente"]}); continue
        ok, why = literal(r)
        if not ok or (r["campo"] in ("horas", "fuerza", "dosis") and r["nota"]):
            dropped.append({"n": n, "nombre": m["name"], "campo": r["campo"], "valor": r["valor"], "motivo": why or r["nota"], "fuente": r["fuente"]}); continue
        got[r["campo"]] = r
    row = {"n": n, "id": mid, "nombre": m["name"]}
    for campo, field, norm in (("familia", "family", family), ("fuerza", "strength", strength), ("horas", "tenacity_hours", hours)):
        r = got.get(campo)
        v = norm(r["valor"]) if r else None
        row[field], row[field + "_fuente"] = "", ""
        if r and not v:
            dropped.append({"n": n, "nombre": m["name"], "campo": campo, "valor": r["valor"], "motivo": "no se lee en el vocabulario de la app", "fuente": r["fuente"]})
        elif v and not m[field]:
            row[field], row[field + "_fuente"] = v, r["fuente"]
        elif v and m[field] and str(v) != str(m[field]).split(".")[0] and not (field == "tenacity_hours" and same_hours(v, m[field])):
            differ.append({"n": n, "nombre": m["name"], "campo": field, "tiene": m[field], "tgsc": v, "fuente_tiene": (m.get(field[:8] + "_source") or m.get(field.split("_")[0] + "_source") or "")[:160], "fuente_tgsc": r["fuente"]})
    props.append(row)
    if (r := got.get("dosis")) and mid not in tg_doses:
        hi = num(r["valor"])
        doses.append({"n": n, "id": mid, "nombre": m["name"], "min": "", "typical": "", "max": f"{float(hi) / 100:.6g}", "basis": "concentrate", "fuente": r["fuente"], "nota": "TGSC recommendation of use"})
    if (r := got.get("olor")) and mid not in tg_desc:
        odors.append({"n": n, "id": mid, "nombre": m["name"], "texto": f"TGSC: {r['valor']}", "fuente": r["fuente"]})
    p = {"n": n, "id": mid, "nombre": m["name"]}
    for campo, field, conv in (("appearance", "appearance", lambda v: v), ("specific gravity", "density", num),
                               ("molecular weight", "molecular_weight", num), ("formula", "formula", lambda v: v.replace(" ", "")),
                               ("vapor pressure", "vapor_pressure", lambda v: v.rstrip(".")),
                               ("melting point", "melting_point_c", lambda v: num(v) if " to " not in v and "°C" in v else None)):
        r = got.get(campo)
        p[field] = conv(r["valor"]) if r and not m[field] else ""
        if p[field] is None:
            p[field] = ""
    if not m["solubility"] and (got.get("soluble in") or got.get("insoluble in")):
        p["solubility"] = "; ".join(f"{k.capitalize()}: {got[k]['valor']}" for k in ("soluble in", "insoluble in") if got.get(k))
    else:
        p["solubility"] = ""
    url = next((r["fuente"].split(": «")[0].split(", ", 1)[1] for r in got.values()), "")
    if any(p[k] for k in p if k not in ("n", "id", "nombre")):
        p["fuente"] = f"TGSC, {url}"
        phys.append(p)

# Segunda parte (el usuario, 2026-11-23: «Que se ha quedado fuera? Puedes buscar otras fuentes para eso?»):
# lo que un lector Sonnet copió de otras páginas (web-64-2.csv), con las reglas de la tanda 61: la frase tiene
# que estar en la página guardada; otra forma, otro CAS o el diluido no valen para cifras; familia, horas y
# fuerza por normalizar.choose (orden de referencias; si no coinciden, la primera y el campo disputado);
# el uso, una fila por referencia (como mucho tres, V3-105).
from normalizar import choose, rank, site  # noqa: E402

OTHER = re.compile(r"otro CAS|no coincide|otra especie|otro proceso|otra parte|otro grado|otro producto|otra forma|otra casa|parecido|no idéntic|tope (?:de )?ifra|l[ií]mite (?:de )?ifra|ifra limit", re.I)
DILUTED = re.compile(r"diluid|al \d+ ?% en (dpg|ipm|tec|alcohol|etanol)|\d+ ?% en (dpg|ipm|tec|alcohol|etanol)", re.I)
NUMR = r"(\d+(?:[.,]\d+)?)"


def dose_of(text):
    """(min, typical, max, basis) as fractions, from a dose phrase (tanda 61, info-61/consolidar.py)."""
    t = text.replace("–", "-").replace("—", "-").lower()
    if not re.search(NUMR + r"\s*%", t):
        return None
    f = lambda v: float(v.replace(",", ".")) / 100
    basis = ("concentrate" if re.search(r"concentrate|fragrance compound|compound|of the formula|in the formula|perfume oil|fragrance oil", t) else
             "finished_product" if re.search(r"finished|fine fragrance|in the product|eau de|edp|edt|final product", t) else "undeclared")
    med = re.search(r"median(?: of| use)?(?: at)?\s*" + NUMR + r"\s*%", t)
    if med:
        return None, f(med.group(1)), None, basis
    ranges = re.findall(NUMR + r"\s*%?\s*(?:-|to|a)\s*" + NUMR + r"\s*%", t) + re.findall(r"between\s*" + NUMR + r"\s*%?\s*and\s*" + NUMR + r"\s*%", t)
    if ranges:
        lo, hi = min(f(a) for a, _ in ranges), max(f(b) for _, b in ranges)
        return (lo, None, hi, basis) if lo < hi else (None, None, hi, basis)
    up = re.search(r"(?:up ?to|max(?:imum)?|traces? to|no more than|below|under)\s*:?\s*" + NUMR + r"\s*%", t)
    if up:
        return None, None, f(up.group(1)), basis
    one = re.findall(NUMR + r"\s*%", t)
    return (None, f(one[0]), None, basis) if len(one) == 1 else None


web = {}
if (HERE / "web-64-2.csv").exists():
    for r in rd(HERE / "web-64-2.csv"):
        web.setdefault((r["n"].strip(), r["campo"].strip()), []).append(r)
by_n = {x["n"]: x for x in lista}
prop_of = {r["id"]: r for r in props}
for r in props:
    for f in ("family", "strength", "tenacity_hours"):
        r.setdefault(f + "_disputado", ""); r.setdefault(f + "_otras", "")
for n in sorted({k[0] for k in web}, key=lambda v: int(v) if v.isdigit() else 0):
    mid = by_n[n]["material_id"]; m = materials[mid]; row = prop_of[mid]

    def keep(campo, cifra):
        good = []
        for r in web.get((n, campo), []):
            if not r["valor"].strip():
                dropped.append({"n": n, "nombre": m["name"], "campo": campo, "valor": "", "motivo": r["nota"] or "no lo dice", "fuente": r["fuente"]}); continue
            ok, why = literal(r)
            # scent.vn writes its text with AI (batch 60); the shop's «SCENT STRENGTH» goes only in the notes
            # (V3-97, batch 57); a dose «of a 10 % solution» is not a dose of the material.
            why = why or ("scent.vn: texto generado por IA" if "scent.vn" in r["fuente"] else
                          "fuerza de la tienda (V3-97): solo en las notas" if campo == "fuerza" and "perfumiarz" in r["fuente"].lower() else
                          "dosis de una solución, no del material" if campo == "dosis" and re.search(r"solution", r["fuente"], re.I) else "")
            ok = ok and not why
            if not ok or OTHER.search(r["nota"]) or (cifra and DILUTED.search(r["nota"])):
                dropped.append({"n": n, "nombre": m["name"], "campo": campo, "valor": r["valor"], "motivo": why or r["nota"], "fuente": r["fuente"]}); continue
            good.append(r)
        return good

    for campo, field in (("familia", "family"), ("horas", "tenacity_hours"), ("fuerza", "strength")):
        if m[field] or row[field] or (field == "strength" and m["impact"]):
            continue
        value, first, disputed, otras, regla = choose(campo, keep(campo, campo != "familia"))
        if value:
            row[field], row[field + "_fuente"] = value, first["fuente"]
            row[field + "_disputado"], row[field + "_otras"] = ("si" if disputed else ""), otras
    sites = set()
    for r in sorted(keep("dosis", True), key=lambda r: rank(r["fuente"])):
        d = dose_of(" ".join(QUOTE.findall(r["fuente"])) or r["valor"])
        if not d or site(r["fuente"]) in sites or len(sites) == 3:
            if not d:
                dropped.append({"n": n, "nombre": m["name"], "campo": "dosis", "valor": r["valor"], "motivo": "sin cifra que leer", "fuente": r["fuente"]})
            continue
        sites.add(site(r["fuente"]))
        lo, typ, hi, basis = d
        doses.append({"n": n, "id": mid, "nombre": m["name"], "min": "" if lo is None else f"{lo:.6g}", "typical": "" if typ is None else f"{typ:.6g}",
                      "max": "" if hi is None else f"{hi:.6g}", "basis": basis, "fuente": r["fuente"], "nota": r["nota"]})
    for r in keep("olor", False)[:2]:
        odors.append({"n": n, "id": mid, "nombre": m["name"], "texto": f"{site(r['fuente'])}: {r['valor'].strip()}", "fuente": r["fuente"]})
    taken = {f for q in phys if q["id"] == mid for f in ("appearance", "density", "solubility") if q.get(f)}
    for campo, field, conv in (("aspecto", "appearance", lambda v: v.strip()), ("densidad", "density", num), ("solubilidad", "solubility", lambda v: v.strip())):
        if m[field] or field in taken:
            continue
        good = sorted(keep(campo, False), key=lambda r: rank(r["fuente"]))
        v = conv(good[0]["valor"]) if good else None
        if v:
            q = {"n": n, "id": mid, "nombre": m["name"], **{k: "" for k in ("appearance", "density", "molecular_weight", "formula", "vapor_pressure", "melting_point_c", "solubility")}, field: v, "fuente": good[0]["fuente"]}
            phys.append(q); taken.add(field)

for name, rows in (("propuesta-64.csv", props), ("dosis-64.csv", doses), ("fisico-64.csv", phys), ("olores-64.csv", odors), ("distintos-64.csv", differ), ("no-usado-64.csv", dropped)):
    cols = list(rows[0]) if rows else ["n"]
    if name == "fisico-64.csv":
        cols = ["n", "id", "nombre", "appearance", "density", "molecular_weight", "formula", "vapor_pressure", "melting_point_c", "solubility", "fuente"]
    with open(HERE / name, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols, lineterminator="\n"); w.writeheader(); w.writerows(rows)
fill = sum(bool(r[k]) for r in props for k in ("family", "strength", "tenacity_hours"))
print(f"{fill} campos (familia, fuerza, horas); {len(doses)} usos; {len(phys)} con físicos; {len(odors)} olores; {len(differ)} distintos; {len(dropped)} no usados")
