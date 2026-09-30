#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Junta los usos habituales ya auditados en una fila por material (plan E6, P59).

Lee el lote auditado `docs/investigacion/2026-09-30-usos-y-constituyentes/lotes/U-001.csv`
y escribe `datos/glosario/origen/usos-habituales.csv`, que lee `generar_glosario.py`.

La regla, para que una franja que viene de una mediana pueda rehacerse a mano:

1. Solo cuentan las filas con `auditoria` = `aceptada`. Las excluidas y la que no tiene cifra
   no entran.
2. **Base.** Solo entran en la franja las filas con base `concentrado` (% del concentrado, que
   es la base de la franja en la ficha). Las de base `producto` o `desconocida` **no se
   convierten ni se descartan en silencio**: se cuentan en `n_otras_bases`. Lo desconocido no
   vale cero ni se toma por concentrado (§1.2).
3. **Franja habitual.** De las filas de papel `habitual`, y de las de papel `habitual y techo`
   (PerfumersWorld) que tengan su medio:
   - `uso_min_pct` = mediana de sus `min_pct` (las filas sin mínimo no cuentan para el mínimo);
   - `uso_max_pct` = mediana de sus máximos habituales: el `max_pct` de una fila `habitual`;
     en una `habitual y techo`, **su medio**, que se saca de la `cita` con una expresión
     regular («0.100% From 7.000% Average 40.000% Maximum» da 7). Su «Maximum» (`max_pct`) no
     es habitual: cuenta solo para el techo. Si la cita no trae el medio, esa fila no entra en
     la franja y cuenta solo para el techo.
   La mediana de una cantidad par de valores es la media de los dos del medio (exacta, con
   fracciones: nunca coma flotante).
4. **Consenso.** Se cuentan las fuentes distintas de la franja (`n_fuentes`). Con una sola,
   `consenso` = `recomendacion`; con dos o más, `consenso`. Sin ninguna, la franja queda vacía
   y no hay consenso.
5. **Techo de uso.** El `max_pct` más alto entre las filas de base `concentrado` con papel
   `techo` o `habitual y techo`, con su fuente (`techo_fuente`). Es un techo de uso, no de
   IFRA ni de seguridad: hasta dónde lo lleva alguien.
6. `fuentes` son los nombres cortos de las fuentes de la franja, sin repetir, en orden
   alfabético y separados por « | ». `lote` es el lote del que sale.

Hay una fila por material de los que tienen alguna fila aceptada. Solo usa la biblioteca
estándar. Uso:  python scripts/usos_habituales.py
"""
import csv
import re
import sys
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BATCH = ROOT / "docs" / "investigacion" / "2026-09-30-usos-y-constituyentes" / "lotes" / "U-001.csv"
OUT = ROOT / "datos" / "glosario" / "origen" / "usos-habituales.csv"
LOT = "U-001"

HEADER = ["material_id", "nombre", "uso_min_pct", "uso_max_pct", "consenso", "n_fuentes", "fuentes",
          "techo_pct", "techo_fuente", "n_otras_bases", "lote"]

# The short name of each source, as the card says it. A source that is not here keeps its own.
SHORT_SOURCES = {
    "niveles-de-uso.md (laboratorio): columna Consenso": "Laboratorio",
    "The Good Scents Company (TGSC)": "TGSC",
    "Rango de proveedor citado en niveles-de-uso.md (Maese Lab / Olfatorium)": "Maese Lab / Olfatorium",
    "Givaudan (ficha de molecula)": "Givaudan",
    "Perfumer's Apprentice": "Perfumer's Apprentice",
}


# The middle figure of a PerfumersWorld quote: «0.100% From 7.000% Average 40.000% Maximum».
AVERAGE = re.compile(r"(\d+(?:\.\d+)?)\s*%?\s*Average", re.I)


def short_source(name: str) -> str:
    return SHORT_SOURCES.get(name, name)


def median(values: list[Fraction]) -> Fraction | None:
    """Exact median: the middle value, or the mean of the two in the middle."""
    if not values:
        return None
    v = sorted(values)
    n = len(v)
    return v[n // 2] if n % 2 else (v[n // 2 - 1] + v[n // 2]) / 2


def decimal(x: Fraction | None) -> str:
    """A terminating fraction (the mean of two decimals always is) as a plain decimal text."""
    if x is None:
        return ""
    den = x.denominator
    twos = fives = 0
    while den % 2 == 0:
        den //= 2
        twos += 1
    while den % 5 == 0:
        den //= 5
        fives += 1
    assert den == 1, x
    digits = max(twos, fives)
    scaled = x * 10 ** digits
    assert scaled.denominator == 1, x
    text = str(int(scaled)).rjust(digits + 1, "0")
    return (text[:-digits] + "." + text[-digits:]) if digits else text


def number(cell: str) -> Fraction | None:
    return Fraction(cell) if cell.strip() else None


def build(rows: list[dict]) -> list[dict]:
    by_material: dict[str, list[dict]] = {}
    for r in rows:
        if r["auditoria"] == "aceptada":
            by_material.setdefault(r["material_id"], []).append(r)
    out = []
    for material, group in by_material.items():
        # Each usual row as (row, usual maximum): the maximum of a «habitual» row, the average of
        # a «habitual y techo» one, which only the quote has.
        usual_pairs = []
        for r in group:
            if r["base"] != "concentrado":
                continue
            if r["papel"] == "habitual":
                usual_pairs.append((r, number(r["max_pct"])))
            elif r["papel"] == "habitual y techo":
                found = AVERAGE.search(r["cita"])
                if found:
                    usual_pairs.append((r, Fraction(found.group(1))))
        usual = [r for r, _ in usual_pairs]
        mins = [x for x in (number(r["min_pct"]) for r in usual) if x is not None]
        maxs = [x for _, x in usual_pairs if x is not None]
        sources = sorted({short_source(r["fuente"]) for r in usual})
        ceilings = [(number(r["max_pct"]), short_source(r["fuente"])) for r in group
                    if r["papel"] in ("techo", "habitual y techo") and r["base"] == "concentrado" and number(r["max_pct"]) is not None]
        ceiling = max(ceilings, key=lambda c: c[0]) if ceilings else (None, "")
        out.append({
            "material_id": material,
            "nombre": group[0]["nombre"],
            "uso_min_pct": decimal(median(mins)),
            "uso_max_pct": decimal(median(maxs)),
            "consenso": "" if not sources else "recomendacion" if len(sources) == 1 else "consenso",
            "n_fuentes": len(sources),
            "fuentes": " | ".join(sources),
            "techo_pct": decimal(ceiling[0]),
            "techo_fuente": ceiling[1],
            "n_otras_bases": sum(1 for r in group if r["base"] != "concentrado" and r["papel"] == "habitual"),
            "lote": LOT,
        })
    return sorted(out, key=lambda r: (r["material_id"].split(":")[0], int(r["material_id"].split(":")[1]) if r["material_id"].split(":")[1].isdigit() else 0, r["material_id"]))


def main() -> None:
    with BATCH.open(encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))
    result = build(rows)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=HEADER, lineterminator="\n")
        w.writeheader()
        w.writerows(result)
    banded = [r for r in result if r["uso_max_pct"]]
    print(f"{len(result)} materiales; {len(banded)} con franja "
          f"({sum(r['consenso'] == 'consenso' for r in banded)} consenso, "
          f"{sum(r['consenso'] == 'recomendacion' for r in banded)} recomendacion); "
          f"{sum(1 for r in result if r['techo_pct'])} con techo")


if __name__ == "__main__":
    sys.exit(main())
