"""Merges the web pass (a, b, c, d) into datos/glosario/origen/nombres-comerciales.csv, with the review's rules."""
import csv, re, sys, unicodedata
from pathlib import Path

HERE = Path(__file__).parent
APP = Path("C:/Users/SERGI/Claude/Projects/perfumeria-app")
TRADE = APP / "datos/glosario/origen/nombres-comerciales.csv"
molecules = {r["cas"]: r["nombre"] for r in csv.DictReader((APP / "datos/glosario/materiales.csv").open(encoding="utf-8")) if r["clase"] == "molécula"}
RANK = {"": 0, "baja": 1, "media": 2, "alta": 3}
# The web replaces the name only where the review said so; elsewhere a new name goes to the others.
REPLACE = {"7779-50-2"}
# The user confirmed «Isobutyl quinoline» and IBQ: the house of one isomer does not own them.
KEEP_HOUSE_EMPTY = {"65442-31-1", "93-19-6", "1333-58-0"}
MIRROR = "pdfcoffee.com"


def norm(t):
    t = unicodedata.normalize("NFD", t).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]", "", t)


def split(v):
    return [x.strip() for x in re.split(r"\s*[|;]\s*", v or "") if x.strip()]


rows = {r["cas"]: r for r in csv.DictReader(TRADE.open(encoding="utf-8"))}
problems, changes = [], []
for f in ["a-dudosos.csv", "b-uso-del-sector.csv", "c-dsm-firmenich.csv", "d-sueltos.csv"]:
    for w in csv.DictReader((HERE / f).open(encoding="utf-8")):
        w = {k: (v or "").strip() for k, v in w.items()}
        cas = w["cas"]
        if cas not in molecules:
            problems.append(f"{f} {cas}: fuera del glosario de moléculas")
            continue
        if not (w["nombre_comercial"] or w["sigla"] or w["otros_nombres"] or w["casa"]):
            continue  # an answer with no name: its note stays in the research
        url = w["fuente_url"]
        confidence = w["confianza"]
        if MIRROR in url:
            source = "web: Firmenich, Compendium of Perfumery Ingredients 2016 (leído en una copia no oficial)"
            confidence = "media" if RANK[confidence] > RANK["media"] else confidence
        else:
            source = f"web: {url}"
        if "thegoodscentscompany.com" in url and RANK[confidence] > RANK["media"]:
            confidence = "media"
        r = rows.get(cas)
        if r is None:
            r = rows[cas] = {"cas": cas, "nombre_comercial": "", "sigla": "", "otros_nombres": "", "casa": "",
                             "fuente": "", "confianza": "", "nota": ""}
            changes.append(f"nuevo {cas} {w['nombre_comercial'] or w['sigla']}")
        others = split(r["otros_nombres"])
        name = w["nombre_comercial"]
        # The page raises the confidence only if it backs the name that stays in front.
        backs = not name or not r["nombre_comercial"] or cas in REPLACE or norm(name) == norm(r["nombre_comercial"])
        if name:
            if not r["nombre_comercial"] or cas in REPLACE:
                if r["nombre_comercial"] and norm(r["nombre_comercial"]) != norm(name):
                    others.append(r["nombre_comercial"])
                    changes.append(f"cambia {cas}: {r['nombre_comercial']} → {name}")
                r["nombre_comercial"] = name
            elif norm(name) != norm(r["nombre_comercial"]):
                others.append(name)
                changes.append(f"otro nombre {cas}: {name}")
        if w["sigla"] and not r["sigla"]:
            r["sigla"] = w["sigla"]
        for o in split(w["otros_nombres"]):
            o = re.sub(r"\s*\(.*?\)$", "", o).strip()
            if o and norm(o) != norm(r["nombre_comercial"]):
                others.append(o)
        seen, clean = set(), []
        for o in others:
            if norm(o) not in seen and norm(o) != norm(r["nombre_comercial"]):
                seen.add(norm(o))
                clean.append(o)
        r["otros_nombres"] = " | ".join(clean)
        if w["casa"] and cas not in KEEP_HOUSE_EMPTY:
            r["casa"] = w["casa"]
        if source not in r["fuente"]:
            r["fuente"] = " · ".join(p for p in (r["fuente"], source) if p)
        if backs and RANK[confidence] > RANK.get(r["confianza"], 0):
            r["confianza"] = confidence
        if w["nota"] and w["nota"] not in r["nota"]:
            r["nota"] = " ".join(p for p in (r["nota"], w["nota"]) if p)

print(f"{len(rows)} filas; {sum(1 for r in rows.values() if r['nombre_comercial'])} con nombre, {sum(1 for r in rows.values() if r['sigla'])} con sigla")
print(f"{len(problems)} problemas:", *problems, sep="\n")
print(f"{len(changes)} cambios:", *changes, sep="\n")
if "--escribir" in sys.argv:
    with TRADE.open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=["cas", "nombre_comercial", "sigla", "otros_nombres", "casa", "fuente", "confianza", "nota"], lineterminator="\n")
        w.writeheader()
        w.writerows(sorted(rows.values(), key=lambda r: r["cas"]))
    print("escrito", TRADE)
