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
   **Cada fuente cuenta una vez:** primero la mediana de las cifras de esa fuente, después la
   mediana entre fuentes (2026-10-01). La mediana de una cantidad par de valores es la media de los
   dos del medio (exacta, con fracciones: nunca coma flotante).
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

8. **Naturales de U-002 en «forma ambigua»** (2026-10-01, opción A del usuario): el CAS de un
   natural lo comparten sus formas. La forma de la ficha la da `U-002-formas.csv`
   (`scripts/formas_fuentes.py`). Una ficha es de un CAS, así que va a **todos los naturales del
   glosario con ese CAS**, no solo a los que buscó U-002, salvo a los auditados a mano en U-001,
   que se quedan con lo que eligió su auditoría:
   - si la ficha dice su forma y el material tiene la suya, la fila cuenta **solo si coinciden**,
     como una fila aceptada más;
   - si la ficha no la dice, o el material es la planta sin forma, la fila **vale para todas las
     formas**, con la fuente marcada «(sin distinguir forma)», **solo mientras esa forma no tenga
     cifra propia** (para la franja y para el techo por separado). Esas fuentes **nunca hacen
     consenso**: con ellas solas, la franja es `recomendacion`.

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
# The form of every U-002 page (rule 8), and the form of every glossary material.
FORMS = LOTS_DIR / "U-002-formas.csv"
MATERIALS = ROOT / "datos" / "glosario" / "materiales.csv"
ANY_FORM = " (sin distinguir forma)"
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
    if name.endswith(ANY_FORM):
        return SHORT_SOURCES.get(name[: -len(ANY_FORM)], name[: -len(ANY_FORM)]) + ANY_FORM
    return SHORT_SOURCES.get(name, name)


def by_form(rows: list[dict], audited: set[str]) -> list[dict]:
    """Rule 8: the natural pages U-002 left as «forma ambigua», given to the forms they speak of.

    A page is about a CAS, so it goes to every natural of the glossary with that CAS, not only to
    the ones U-002 looked up (the shops' naturals): the concrete of a lavender gets its page too.
    """
    with FORMS.open(encoding="utf-8", newline="") as f:
        page_form = {r["url"]: r["forma"] for r in csv.DictReader(f)}
    with MATERIALS.open(encoding="utf-8", newline="") as f:
        naturals = [m for m in csv.DictReader(f) if m["clase"] == "natural" and m["cas"]]
    by_cas: dict[str, list[dict]] = {}
    for m in naturals:
        by_cas.setdefault(m["cas"], []).append(m)
    # One row per page and role, whichever material U-002 wrote it under.
    pages: dict[tuple[str, str, str], dict] = {}
    for r in rows:
        if r["auditoria"] == "forma ambigua" and r["notas"].startswith("Natural:") and r["cas"] in by_cas:
            pages.setdefault((r["cas"], r["url"], r["papel"]), r)
    out = []
    for (cas, url, _), r in pages.items():
        source = page_form.get(url, "")
        for m in by_cas[cas]:
            if m["id"] in audited:
                continue
            mine = m["tipo_natural"]
            row = {**r, "material_id": m["id"], "nombre": m["nombre"], "auditoria": "aceptada"}
            if source and mine:
                if source == mine:
                    out.append(row)
            else:
                out.append({**row, "fuente": r["fuente"] + ANY_FORM})
    return out


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
    seen: set[tuple[str, ...]] = set()
    for r in rows:
        if r["auditoria"] == "aceptada":
            # The same page can reach a material twice (U-001 and, by rule 8, U-002): it counts once,
            # the first time, so a source never weighs double in a median.
            key = (r["material_id"], r.get("url", ""), r["papel"], r["base"], r["min_pct"], r["max_pct"])
            if key[1] and key in seen:
                continue
            seen.add(key)
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
        # Rule 8: a figure that does not tell the form stands in only while the form has none of its own.
        if any(not r["fuente"].endswith(ANY_FORM) for r, _ in usual_pairs):
            usual_pairs = [(r, x) for r, x in usual_pairs if not r["fuente"].endswith(ANY_FORM)]
        usual = [r for r, _ in usual_pairs]
        # Each source counts once: the median of its own figures first, then the median across
        # sources. Several pages of one source (the lemon oils of PerfumersWorld) never outvote another.
        per_min: dict[str, list[Fraction]] = {}
        per_max: dict[str, list[Fraction]] = {}
        for r, x in usual_pairs:
            name = short_source(r["fuente"])
            if number(r["min_pct"]) is not None:
                per_min.setdefault(name, []).append(number(r["min_pct"]))
            if x is not None:
                per_max.setdefault(name, []).append(x)
        mins = [median(v) for v in per_min.values()]
        maxs = [median(v) for v in per_max.values()]
        sources = sorted({short_source(r["fuente"]) for r in usual})
        # Rule 8: a source that does not tell the form never makes a consensus.
        sure = [x for x in sources if not x.endswith(ANY_FORM)]
        ceilings = [(number(r["max_pct"]), short_source(r["fuente"])) for r in group
                    if r["papel"] in ("techo", "habitual y techo") and r["base"] == "concentrado" and number(r["max_pct"]) is not None]
        if any(not c[1].endswith(ANY_FORM) for c in ceilings):
            ceilings = [c for c in ceilings if not c[1].endswith(ANY_FORM)]
        ceiling = max(ceilings, key=lambda c: c[0]) if ceilings else (None, "")
        out.append({
            "material_id": material,
            "nombre": group[0]["nombre"],
            "uso_min_pct": decimal(median(mins)),
            "uso_max_pct": decimal(median(maxs)),
            "consenso": "" if not sources else "consenso" if len(sure) >= 2 else "recomendacion",
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
            lot_rows = [{**r, "lote": lot} for r in csv.DictReader(f)]
        rows += lot_rows
        if lot == "U-002":
            # A material audited by hand in U-001 keeps what its audit chose.
            audited = {r["material_id"] for r in rows if r["lote"] == "U-001"}
            rows += by_form(lot_rows, audited)
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
