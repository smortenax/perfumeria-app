"""La fuerza de cada producto de perfumería de Maese Lab, de 1 a 10 (la escala de impacto de PerfuMate, V3-97).

Lee cruce.csv (cruzar.py), equivalencias.csv (las parejas que la sesión eligió a mano cuando el cruce
automático no encontró nada o encontró otro proceso) y segunda-fuente.csv (lo leído en la web para lo
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


def main():
    db = sqlite3.connect(PM)
    pm = {n: (i, u, d) for n, i, u, d in db.execute(
        "SELECT name, impact, source_url, working_dilution FROM materials")}
    eq = {r["n"]: r for r in read("equivalencias.csv")}
    web = {r["n"]: r for r in read("segunda-fuente.csv")}
    out = []
    for r in read("cruce.csv"):
        n, kind = r["n"], r["tipo"]
        diluted_kind = kind in ("tintura", "dilucion", "reduccion")
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
        pct = r["pct_declarado"]
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
        if propuesto is None:
            confianza = "sin dato"
        elif rol == "mismo" and (r["pm_como"] == "cas" or n in eq) and "no cuadra" not in contraste and "lo común dice" not in contraste:
            confianza = "alta"
        elif rol in ("mismo", "pariente", "web"):
            confianza = "media"
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
