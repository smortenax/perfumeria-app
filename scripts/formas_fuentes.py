#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""La forma de natural de cada ficha de uso de U-002 (aceite, absoluto...), para asignar sus cifras.

Las filas de naturales de `U-002.csv` quedaron como «forma ambigua»: el CAS de un natural es el de
la planta, y lo comparten su aceite, su absoluto, su concreto... Pero la ficha de donde sale cada
cifra suele decir de qué forma habla:

* **TGSC**: el prefijo de la dirección es su propia clase de la ficha: `es` aceite esencial, `ab`
  absoluto, `co` concreto, `rs` resinoide, `ol` oleorresina, `tl` tintura, `ex` extracto. Otro
  prefijo (`rw` materia prima, `vg`...) no dice forma.
* **PerfumersWorld**: el nombre del producto, en el `<h1>` de la ficha («Lavender Oil French»,
  «Labdanum Absolute»). Se busca la palabra de la forma; si no hay ninguna, o hay varias, no dice
  forma.

Escribe `docs/investigacion/2026-09-30-usos-y-constituyentes/lotes/U-002-formas.csv` (url, fuente,
producto, forma), que lee `scripts/usos_habituales.py`. Se guarda en Git para que la regla no
dependa de la caché, que está fuera (`datos/glosario/.cache/usos/`). Forma vacía = la ficha no la
dice. Solo usa la biblioteca estándar.

Uso:  python scripts/formas_fuentes.py
"""
import csv
import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOTS = ROOT / "docs" / "investigacion" / "2026-09-30-usos-y-constituyentes" / "lotes"
CACHE = ROOT / "datos" / "glosario" / ".cache" / "usos"
OUT = LOTS / "U-002-formas.csv"

# TGSC's own class of a page, by the prefix of its address, as the glossary's `tipo_natural`.
TGSC_PREFIX = {"es": "oil", "ab": "absolute", "co": "concrete", "rs": "resinoid", "ol": "oleoresin",
               "tl": "tincture", "ex": "extract"}
# The form words of a PerfumersWorld product name.
PW_WORDS = [("absolute", r"\babs(?:olute)?\b"), ("concrete", r"\bconcrete\b"), ("resinoid", r"\bresinoid\b"),
            ("oleoresin", r"\boleo-?resin\b"), ("tincture", r"\btincture\b"), ("extract", r"\b(?:co2|extract)\b"),
            ("oil", r"\boil\b")]


def pw_page(url: str) -> Path:
    return CACHE / "pw" / url.split("perfumersworld.com/")[1].replace("?", "_").replace("=", "_")


def pw_product(url: str) -> str:
    page = pw_page(url)
    if not page.exists():
        return ""
    found = re.search(r"<h1[^>]*>(.*?)</h1>", page.read_text(encoding="utf-8", errors="ignore"), re.S)
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", found.group(1))).split()) if found else ""


def pw_form(product: str) -> str:
    forms = {form for form, pattern in PW_WORDS if re.search(pattern, product, re.I)}
    # «Oleoresin» also matches nothing else; «Oil» with «Absolute» or «Concrete» is not a form of its own.
    if len(forms) > 1 and "oil" in forms:
        forms.discard("oil")
    return forms.pop() if len(forms) == 1 else ""


def main() -> int:
    with (LOTS / "U-002.csv").open(encoding="utf-8", newline="") as f:
        rows = [r for r in csv.DictReader(f) if r["auditoria"] == "forma ambigua"]
    out = {}
    missing = 0
    for r in rows:
        url = r["url"]
        if url in out:
            continue
        if "goodscents" in url:
            prefix = re.search(r"/data/([a-z]+)\d", url)
            out[url] = {"url": url, "fuente": "TGSC", "producto": "",
                        "forma": TGSC_PREFIX.get(prefix.group(1), "") if prefix else ""}
        else:
            product = pw_product(url)
            missing += product == ""
            out[url] = {"url": url, "fuente": "PerfumersWorld", "producto": product, "forma": pw_form(product)}
    with OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["url", "fuente", "producto", "forma"], lineterminator="\n")
        w.writeheader()
        w.writerows(sorted(out.values(), key=lambda r: r["url"]))
    told = sum(1 for r in out.values() if r["forma"])
    print(f"{OUT.relative_to(ROOT).as_posix()}: {len(out)} fichas, {told} dicen su forma; "
          f"{missing} de PerfumersWorld sin la página en la caché")
    return 0


if __name__ == "__main__":
    sys.exit(main())
