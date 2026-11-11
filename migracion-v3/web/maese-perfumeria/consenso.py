"""La fuerza de cada producto de perfumería de Maese Lab, de 1 a 10 (la escala de impacto de PerfuMate, V3-97).

Lee cruce.csv (cruzar.py), equivalencias.csv (las parejas que la sesión eligió a mano cuando el cruce
automático no encontró nada o encontró otro proceso) y segunda-fuente-*.csv (lo leído en la web para lo
que PerfuMate no tiene). Escribe consenso.csv. Determinista.

Reglas (propuesta de la sesión, sin decidir):
  - «mismo»: el impacto de PerfuMate del mismo material es el impacto del producto.
  - «pariente»: el de un material muy cercano (otra especie del género, otro proceso); confianza media.
  - «base»: el producto es una tintura o una dilución de ese material. Su impacto se estima como
    impacto del material puro − 3 · log10(1 / fracción), redondeado y nunca por debajo de 1.
    Las anclas son de PerfuMate: absoluto de vainilla 7 → tintura de vainilla 4; resinoide de orris 6 →
    tintura de orris 3 (las dos, tinturas hacia el 10-20 %). Es decir: cada dilución a la décima baja
    unos 3 puntos. Si la tintura no dice su porcentaje se toma el 10 %, y se dice.
  - La segunda fuente: lo común de la v3 (el impacto que ya tiene) y la web (segunda-fuente.csv).

  python3 -I migracion-v3/web/maese-perfumeria/consenso.py
"""
import csv
import math
import re
import os
import sqlite3

HERE = os.path.dirname(os.path.abspath(__file__))
PM = os.path.join(HERE, "..", "..", "perfumate", "perfumate.sqlite3")
TINCTURE_DEFAULT = 0.10
STEP_PER_DECADE = 3

STRENGTH_RANGE = {"low": (1, 3), "medium": (4, 6), "high": (7, 8), "very_high": (9, 10)}


def read(name):
    path = os.path.join(HERE, name)
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def diluted(impact: int, fraction: float) -> int:
    return max(1, round(impact - STEP_PER_DECADE * math.log10(1 / fraction)))


NOT_GENUS = {"alcohol", "aqua", "and", "extract", "oil", "essential", "absolute", "natural", "white", "black",
             "red", "green", "sweet", "wild", "none", "assigned", "butter"}
RESIN = ("resin", "gum", "resina")


def group_medians(db):
    """Medianas de PerfuMate de los naturales: por género (palabra entera en nombre o sinónimos) y por proceso."""
    import json
    import re
    import statistics
    rows = [(n, i, " " + re.sub(r"[^a-z0-9]+", " ", (n + " " + " ".join(json.loads(s or "[]"))).lower()) + " ")
            for n, i, s in db.execute(
                "SELECT name, impact, synonyms_json FROM materials WHERE origin = 'natural' AND impact IS NOT NULL")]

    def genus(g):
        v = [(n, i) for n, i, t in rows if f" {g} " in t]
        return (round(statistics.median(i for _, i in v)), [n for n, _ in v]) if v else None

    def proc(word):
        v = [i for n, i, t in rows if word in n.lower()]
        return round(statistics.median(v)), len(v)
    return genus, {"aceite esencial": proc("essential oil"), "absoluto": proc("absolute"), "co2": proc("co2"),
                   "resinoide": proc("resinoid")}


def main():
    db = sqlite3.connect(PM)
    genus_of, by_proc = group_medians(db)
    pm = {n: (i, u, d) for n, i, u, d in db.execute(
        "SELECT name, impact, source_url, working_dilution FROM materials")}
    eq = {r["n"]: r for r in read("equivalencias.csv")}
    web = {}
    for name in sorted(os.listdir(HERE)):
        if name.startswith("segunda-fuente-") and name.endswith(".csv"):
            for x in read(name):  # una fila sin dato no tapa a otra que lo tiene
                if x["n"] not in web or x.get("fuerza") or x.get("impacto"):
                    web[x["n"]] = x
    out = []
    for r in read("cruce.csv"):
        n, kind = r["n"], r["tipo"]
        pct0 = r["pct_declarado"]
        if not pct0:  # «GUAYACO PALO /GAÏAC - 50% DPG»: un porcentaje suelto en el nombre
            m = re.search(r"(\d+(?:[.,]\d+)?)\s*%", r["h1"])
            pct0 = m.group(1).replace(",", ".") if m and float(m.group(1).replace(",", ".")) < 100 else ""
        # Un natural que la web vende diluido (castóreo al 20 %, pepino CO2 al 1 %) cuenta como dilución.
        diluted_kind = kind in ("tintura", "dilucion", "reduccion") or (
            kind != "molecula" and bool(pct0) and 0 < float(pct0) < 100)
        rol, fuente, impacto_puro, pm_nombre, pm_url, como = "", "", None, "", "", ""
        if n in eq:
            e = eq[n]
            rol, pm_nombre, como = e["rol"], e["perfumate"], "a mano: " + e["motivo"]
            if pm_nombre:
                impacto_puro, pm_url, _ = pm[pm_nombre]
        elif r["pm_impacto"]:
            impacto_puro = int(r["pm_impacto"])
            pm_nombre, pm_url = r["pm_nombres"].rsplit(" (", 1)[0] if r["pm_n"] == "1" else r["pm_nombres"], r["pm_url"]
            como = "por " + r["pm_como"]
            rol = "base" if diluted_kind else ("pariente" if r["pm_proceso"] else "mismo")
        if impacto_puro is not None:
            fuente = f"PerfuMate, {pm_url or pm_nombre}: «impact {impacto_puro}» ({pm_nombre}; {como})"
        # Fracción aromática declarada por la web
        pct = pct0
        fraction = float(pct) / 100 if pct and diluted_kind and 0 < float(pct) < 100 else None
        frac_note = f"{pct} % según la web" if fraction else ""
        if rol == "base" and fraction is None:
            fraction, frac_note = TINCTURE_DEFAULT, "la web no da el porcentaje: se toma el 10 % (supuesto)"
        propuesto, regla = None, ""
        if impacto_puro is not None:
            if rol == "base":
                propuesto = diluted(int(impacto_puro), fraction)
                regla = f"{impacto_puro} − 3·log10(1/{fraction:g}) = {propuesto}"
            else:
                propuesto = int(impacto_puro)
        # Segunda fuente web, cuando PerfuMate no da nada
        w = web.get(n)
        if propuesto is None and w and w.get("impacto"):
            propuesto, fuente = int(w["impacto"]), w["fuente"]
            rol = rol or "web"
            if w.get("base") == "si" and fraction:
                regla = f"{w['impacto']} del material puro − 3·log10(1/{fraction:g})"
                propuesto = diluted(int(w["impacto"]), fraction)
        # Consenso general, cuando no hay nada más (propuesta de la sesión): la mediana de PerfuMate del
        # mismo género botánico; si no, la del mismo proceso. Una tintura o una dilución, con la regla.
        web_level = w.get("fuerza") if w else ""
        if propuesto is None and (kind != "molecula" or web_level):
            words = [x for x in re.sub(r"[^a-z ]+", " ", r["inci"].lower()).split() if x not in NOT_GENUS and len(x) > 3]
            g = genus_of(words[0]) if words else None
            if kind == "molecula":
                lo, hi = STRENGTH_RANGE[web_level]
                base_imp, src = round((lo + hi) / 2), "punto medio del nivel"
            elif g:
                base_imp, src = g[0], f"mediana de PerfuMate del género {words[0].capitalize()} ({len(g[1])}: {', '.join(g[1][:4])})"
            else:
                key = "resinoide" if any(x in r["inci"].lower() for x in RESIN) else \
                    ("aceite esencial" if kind in ("tintura", "aceite esencial") else
                     ("co2" if kind == "co2" else "absoluto"))
                base_imp, src = by_proc[key][0], f"mediana de PerfuMate de los naturales tipo {key} ({by_proc[key][1]})"
            # La web (dos referentes que coinciden, o uno) da el nivel en palabras: la cifra se lleva dentro
            # de ese nivel (propuesta de la sesión; V3-97 decía no convertir: lo decide el usuario).
            if web_level:
                lo, hi = STRENGTH_RANGE[web_level]
                if not lo <= base_imp <= hi:
                    src += f"; llevado a {min(max(base_imp, lo), hi)} por la fuerza «{web_level}» de la web"
                    base_imp = min(max(base_imp, lo), hi)
                else:
                    src += f"; cuadra con la fuerza «{web_level}» de la web"
            if diluted_kind:
                if fraction is None:
                    fraction, frac_note = TINCTURE_DEFAULT, "la web no da el porcentaje: se toma el 10 % (supuesto)"
                propuesto = diluted(base_imp, fraction)
                regla = f"{base_imp} − 3·log10(1/{fraction:g}) = {propuesto}"
            else:
                propuesto = base_imp
            impacto_puro, fuente = base_imp, "consenso general: " + src
            rol = "grupo+web" if web_level else "grupo"
        # Contraste con lo común de la v3 (mismo CAS)
        comun_imp = [x for x in r["comun_impacto"].split(" | ") if x and x != "—"]
        comun_str = [x for x in r["comun_fuerza"].split(" | ") if x and x != "—"]
        contraste = ""
        if propuesto is not None and rol in ("mismo", "pariente"):
            if comun_imp:
                contraste = "igual que lo común" if str(propuesto) in comun_imp else f"lo común dice {'/'.join(comun_imp)}"
            elif comun_str and comun_str[0] in STRENGTH_RANGE:
                lo, hi = STRENGTH_RANGE[comun_str[0]]
                contraste = (f"cuadra con la fuerza «{comun_str[0]}» de lo común" if lo <= propuesto <= hi
                             else f"no cuadra con la fuerza «{comun_str[0]}» de lo común")
        if w and w.get("impacto") and fuente and not fuente.startswith(w.get("fuente", "")[:20]):
            contraste += ("; " if contraste else "") + f"web: {w['fuente']}"
        # La fuerza en palabras (TGSC y otras) no se convierte a número (V3-97).
        palabras = ""
        if w and w.get("fuerza"):
            palabras = w["fuerza"] + (" (del material puro)" if w.get("base") == "si" else "")
        if propuesto is None:
            confianza = "solo en palabras" if palabras else "sin dato"
        elif rol == "mismo" and (r["pm_como"] == "cas" or n in eq) and "no cuadra" not in contraste and "lo común dice" not in contraste:
            confianza = "alta"
        elif rol in ("mismo", "pariente", "web"):
            confianza = "media"
        elif rol == "grupo+web":
            confianza = "baja (web en palabras" + (", dos fuentes)" if w.get("acuerdo") == "si" else ", una fuente)")
        elif rol == "grupo":
            confianza = "muy baja (consenso general)"
        else:
            confianza = "baja (estimada)"
        particular = []
        if r["cas_check"]:
            particular.append(f"CAS de la web: {r['cas_check']}")
        if r["cas_disolvente"]:
            particular.append(f"lleva {r['cas_disolvente']}")
        if kind == "tintura":
            bits = [x for x in (r["cargas"] and f"cargas: {r['cargas']}", r["graduacion"] and f"graduación: {r['graduacion']}") if x]
            particular.append("tintura" + (f" ({', '.join(bits)})" if bits else "") + ": poca materia aromática")
        if frac_note:
            particular.append(frac_note)
        out.append({
            "n": n, "categoria": r["categoria"], "nombre_web": r["h1"] or r["nombre_web"], "url": r["url"],
            "tipo": kind, "cas": r["cas"], "inci": r["inci"],
            "impacto_propuesto": "" if propuesto is None else propuesto,
            "rol": rol, "impacto_material_puro": "" if impacto_puro is None else impacto_puro,
            "fuerza_en_palabras": palabras, "fuente_palabras": w["fuente"] if w and palabras else "",
            "fuente_palabras_2": w.get("fuente2", "") if w and palabras else "",
            "dilucion_uso_web": w.get("dilucion_uso", "") if w else "",
            "regla": regla, "fuente": fuente, "contraste": contraste, "confianza": confianza,
            "particularidades": "; ".join(particular),
            "comun": r["comun"], "comun_id": r["comun_id"],
            "perfumate_dilucion_de_trabajo": pm.get(pm_nombre, (None, None, ""))[2] if pm_nombre in pm else r["pm_dilucion"],
        })
    cols = list(out[0].keys())
    with open(os.path.join(HERE, "consenso.csv"), "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, cols, lineterminator="\n")
        w.writeheader()
        w.writerows(out)
    from collections import Counter
    print(len(out), Counter(r["confianza"] for r in out))
    print(Counter(r["rol"] for r in out))


if __name__ == "__main__":
    main()
