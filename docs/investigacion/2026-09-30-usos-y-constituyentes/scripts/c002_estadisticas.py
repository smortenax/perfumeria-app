#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""C-002: numbers for the summary, read from lotes/*.csv and C-002-diagnostico.json."""
import csv, json, os, sys, collections
sys.path.insert(0, os.path.dirname(__file__))
from c002_lib import *

L = os.path.join(REPO, "docs/investigacion/2026-09-30-usos-y-constituyentes/lotes")
d = json.load(open(os.path.join(L, "C-002-diagnostico.json"), encoding="utf-8"))
C = list(csv.DictReader(open(os.path.join(L, "C-002.csv"), encoding="utf-8")))
S = list(csv.DictReader(open(os.path.join(L, "C-002-sin-glosario.csv"), encoding="utf-8")))
X = list(csv.DictReader(open(os.path.join(L, "X-001.csv"), encoding="utf-8")))
print("contadores:", json.dumps(d["_contadores"], ensure_ascii=False, indent=1))
print("filas C-002:", len(C), "materiales distintos:", len({r["material_id"] for r in C}))
print("filas sin-glosario:", len(S), "productos (nombre):", len({r["nombre"] for r in S}))
print("tipo_valor C-002:", collections.Counter(r["tipo_valor"] for r in C))
print("constituyentes C-002:", collections.Counter(r["constituyente"] for r in C).most_common(12))
print("marcas X-001:", collections.Counter(r["marca"] for r in X))
print("estados X-001:", collections.Counter(r["estado_glosario"][:16] for r in X))


def lim(r):
    try:
        return float(r["cat4_certificado"].split(" ")[0].replace(",", "."))
    except ValueError:
        return -1.0


dis = [r for r in X if r["marca"] == "discrepancia"]
dis.sort(key=lambda r: (bool(r["nota"]), lim(r) if lim(r) >= 0 else 999))
print("discrepancias:", len(dis), "con nota de limite propio:", sum(1 for r in dis if r["nota"]))
for r in dis[:14]:
    print(" ", r["material_id"], "|", r["nombre"][:40], "|", r["cat4_certificado"], "|", r["estado_glosario"], "| propio" if r["nota"] else "| sin nota", "|", r["cita"][-50:])
print("huecos (sin-dato con limite):")
for r in X:
    if r["marca"] == "hueco":
        print(" ", r["material_id"], r["nombre"][:40], r["cat4_certificado"])
# naturals with an SDS
pages, pdf_pages, mats, by_cas, name_idx, ifra = load_catalogue()
nat = set(); natc = set()
for dd in d.get("naturales-con-constituyentes", []):
    natc.add(dd)
print("naturales/mezclas con constituyentes (ids o paginas):", len(natc))
for k in ("ilegibles", "otro", "alergenos", "sds-sin-seccion3"):
    print(k, len(d[k]))
print("otro:", d["otro"])
print("sds-no-alineable (no FDS):", [x for x in d["sds-no-alineable"] if "FDS" not in x][:60])
