#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Junta los usos habituales ya auditados en una fila por material (plan E6, P59).

Lee los lotes `U-001.csv` (auditado a mano) y `U-002.csv` (de `traer_usos.py`) de
`docs/investigacion/2026-09-30-usos-y-constituyentes/lotes/`
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

7. **Lotes de búsqueda** (`U-004`, `U-005`: una búsqueda web por material, P60). Sus filas no traen
   `auditoria`; entran las de base `concentrado`, con cifra, cuya nota no las marque como dudosas
   («dudos», «reserva», «copia», «atención») y que no vengan de TGSC ni de PerfumersWorld (esas ya llegan
   leídas de su página en U-002). La franja `estandar` es uso habitual y la `techo`, techo; las
   `trazas` no entran todavía. **Todo lo de la búsqueda de un material cuenta como una sola
   fuente**, «Búsqueda web (dominios)», porque el resumen del buscador ya mezcla varias.

Todos los lotes se juntan **por material**: una fila por material de los que tienen alguna fila
que cuente, con `lote` = los lotes de los que sale. Solo usa la biblioteca
estándar. Uso:  python scripts/usos_habituales.py
"""
import csv
import re
import sys
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOTS_DIR = ROOT / "docs" / "investigacion" / "2026-09-30-usos-y-constituyentes" / "lotes"
# U-001 was audited by hand; U-002 comes from scripts/traer_usos.py, whose `auditoria` is set by rule.
LOTS = ["U-001", "U-002"]
# Search lots (P60): one web search per material, read from the search engine's summary.
SEARCH_LOTS = ["U-004", "U-005"]
DOUBTFUL = re.compile(r"dudos|reserva|copia|atenci", re.I)
OLD_SOURCES = re.compile(r"good ?scents|tgsc|perfumersworld|perflavory", re.I)
DOMAIN = re.compile(r"([a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|co\.uk|de|fr|es|nl|io|eu|jp))", re.I)
OUT = ROOT / "datos" / "glosario" / "origen" / "usos-habituales.csv"

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


def search_rows(rows: list[dict], lot: str) -> list[dict]:
    """The rows of a search lot that count, in the shape of an audited lot (rule 7)."""
    by_material: dict[str, list[dict]] = {}
    for r in rows:
        if (r["base"] == "concentrado" and r["franja"] in ("estandar", "techo") and number(r["max_pct"]) is not None
                and not DOUBTFUL.search(r["notas"]) and not OLD_SOURCES.search(r["fuente"])):
            by_material.setdefault(r["material_id"], []).append(r)
    out = []
    for material, group in by_material.items():
        domains = sorted({d.lower() for r in group for d in DOMAIN.findall(r["fuente"])})
        source = f"Búsqueda web ({', '.join(domains)})" if domains else "Búsqueda web"
        for r in group:
            out.append({**r, "fuente": source, "auditoria": "aceptada", "lote": lot,
                        "papel": "habitual" if r["franja"] == "estandar" else "techo"})
    return out


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
            "lote": " | ".join(sorted({r["lote"] for r in group})),
        })
    return sorted(out, key=lambda r: (r["material_id"].split(":")[0], int(r["material_id"].split(":")[1]) if r["material_id"].split(":")[1].isdigit() else 0, r["material_id"]))


def main() -> None:
    rows = []
    for lot in LOTS:
        with (LOTS_DIR / f"{lot}.csv").open(encoding="utf-8", newline="") as f:
            rows += [{**r, "lote": lot} for r in csv.DictReader(f)]
    for lot in SEARCH_LOTS:
        with (LOTS_DIR / f"{lot}.csv").open(encoding="utf-8", newline="") as f:
            rows += search_rows(list(csv.DictReader(f)), lot)
    result = build(rows)
    result.sort(key=lambda r: (r["material_id"].split(":")[0], int(r["material_id"].split(":")[1]) if r["material_id"].split(":")[1].isdigit() else 0, r["material_id"]))
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
