"""Tanda 46 (V3-101): de lo leído en la web (web-*.csv) y de PerfuMate (huecos.csv), una propuesta por hueco.

Para cada común y cada campo que le falta, junta lo que dice cada referencia, lo normaliza al vocabulario
de la app y elige por este orden de referencias: TGSC, la casa (Givaudan, dsm-firmenich, IFF, Symrise…),
Fraterworks, Perfumer's Apprentice, ScenTree, Scentspiracy, PerfumersWorld, Premiere Peau, PerfuMate.
Si las referencias no dicen lo mismo, el campo va como disputado y la columna `otras` dice qué dice cada
una. Premiere Peau repite a menudo las cifras de TGSC: cuando coincide con TGSC no cuenta como segunda
referencia independiente. Lo que se refiere a otro producto (el material puro para una tintura, el
producto diluido) se queda fuera, con su motivo.

    python3 -I migracion-v3/web/completar-comunes/consolidar.py
"""
import csv, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from normalizar import FIELD, choose  # noqa: E402

OUT = HERE / "propuesta.csv"

huecos = {r["nombre"]: r for r in csv.DictReader(open(HERE / "huecos.csv", encoding="utf-8"))}
by_n = {i: r for i, r in enumerate(huecos.values(), 1)}
reads = {}
for path in sorted(HERE.glob("web-*.csv")):
    for r in csv.DictReader(open(path, encoding="utf-8")):
        h = by_n[int(r["n"])]
        reads.setdefault((h["nombre"], r["campo"]), []).append(r)
# PerfuMate (local) como última referencia: horas y familia.
for h in huecos.values():
    if h["pm_horas"] and "|" not in h["pm_horas"] and "horas" in h["falta"]:
        reads.setdefault((h["nombre"], "horas"), []).append({"valor": h["pm_horas"], "fuente": f"PerfuMate, {h['pm_url']}: «{h['pm_horas_texto'] or h['pm_horas'] + ' h'}»", "nota": ""})
    if h["pm_familia"] and "familia" in h["falta"]:
        reads.setdefault((h["nombre"], "familia"), []).append({"valor": h["pm_familia"], "fuente": f"PerfuMate, {h['pm_url'].split(' | ')[0]}: «{h['pm_familia']}»", "nota": ""})

out = []
for h in huecos.values():
    tincture = "tincture" in h["nombre"].lower()
    for campo in [c.strip() for c in h["falta"].split(",")]:
        value, first, disputed, otras, regla = choose(campo, reads.get((h["nombre"], campo), []), tincture)
        out.append({"id": h["id"], "nombre": h["nombre"], "campo": FIELD[campo], "valor": value or "",
                    "fuente": first["fuente"] if first else "", "disputado": ("si" if disputed else "no") if value else "",
                    "otras": otras, "regla": regla})

with open(OUT, "w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=["id", "nombre", "campo", "valor", "fuente", "disputado", "otras", "regla"], lineterminator="\n")
    w.writeheader(); w.writerows(out)
filled = [r for r in out if r["valor"]]
print(f"{len(out)} huecos: {len(filled)} con valor ({sum(r['disputado'] == 'si' for r in filled)} disputados), {len(out) - len(filled)} sin")
