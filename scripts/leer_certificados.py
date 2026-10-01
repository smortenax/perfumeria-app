#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Transcribe los certificados de conformidad IFRA que el usuario guarda de sus proveedores (P61).

Lee los PDF de `docs/proveedores/certificados/` con el formato de Firmenich («IFRA Certificate of
Conformity for Ingredients/Bases») y escribe `docs/proveedores/certificados/certificados.csv`:
una fila por cada tope de categoría (sección 1) y por cada sustancia prohibida o restringida con su
cantidad en el producto (secciones 2.1 y 2.2), con su estándar IFRA si lo tiene.

**Para qué:** son productos concretos que el usuario tiene o va a comprar, como el Castoreum Synth
184004. Todavía no tienen fila en el glosario: entrarán con el alta de materiales propios (P61), y
entonces su sección 2.2 son sus constituyentes, que la app suma por sustancia (§5.3). **El
certificado no manda sobre IFRA:** la app juzga cada sustancia con los estándares.

Uso:  python scripts/leer_certificados.py
Necesita `pypdf`.
"""
import csv
import re
import sys
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / "docs" / "proveedores" / "certificados"
OUT = FOLDER / "certificados.csv"
STANDARD_CAS = ROOT / "datos" / "ifra" / "51" / "estandar-cas.csv"
HEADER = ["archivo", "proveedor", "producto", "referencia", "revisado", "seccion", "categoria", "sustancia", "cas", "valor", "estandar_ifra"]
CATEGORY = re.compile(r"^(1|2|3|4|5[A-D]|6|7[AB]|8|9|10[AB]|11[AB]|12)\s+.*?\s((?:\d+(?:\.\d+)?%)|Not Permitted|No Restriction)\s*$")
SUBSTANCE = re.compile(r"^(.+?)\s+(\d{2,7}-\d{2}-\d)\s+(\d+(?:\.\d+)?)\s*%\s*$")


def main() -> int:
    with STANDARD_CAS.open(encoding="utf-8", newline="") as f:
        standard = {r["cas"]: r["estandar"] for r in csv.DictReader(f)}
    rows = []
    for pdf in sorted(FOLDER.glob("*.pdf")):
        text = "\n".join(page.extract_text() or "" for page in PdfReader(pdf).pages)
        lines = [" ".join(line.split()) for line in text.splitlines()]
        supplier = "Firmenich" if "Firmenich" in text else ""
        product = next((l for l in lines if re.search(r"\b\d{6}\b", l) and l.isupper() and "IFRA" not in l), "")
        reference = (re.search(r"Reference:\s*(\S+)", text) or [None, ""])[1]
        revised = (re.search(r"Revised on:\s*(\S+)", text) or [None, ""])[1]
        section = ""
        # A category line can break in two in the PDF: its level then ends the second line.
        joined: list[str] = []
        for line in lines:
            if joined and re.match(r"^[a-z(]", line):
                joined[-1] += " " + line
            else:
                joined.append(line)
        for line in joined:
            if line.startswith("1. Maximum permitted"):
                section = "1"
            elif line.startswith("2.1."):
                section = "2.1"
            elif line.startswith("2.2."):
                section = "2.2"
            elif line.startswith("3. "):
                section = ""
            base = {"archivo": pdf.name, "proveedor": supplier, "producto": product, "referencia": reference, "revisado": revised,
                    "seccion": section, "categoria": "", "sustancia": "", "cas": "", "valor": "", "estandar_ifra": ""}
            if section == "1" and (m := CATEGORY.match(line)):
                rows.append({**base, "categoria": m.group(1), "valor": m.group(2)})
            elif section in ("2.1", "2.2") and (m := SUBSTANCE.match(line)):
                rows.append({**base, "sustancia": m.group(1).title(), "cas": m.group(2), "valor": m.group(3),
                             "estandar_ifra": standard.get(m.group(2), "")})
    with OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=HEADER, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    for name in sorted({r["archivo"] for r in rows}):
        mine = [r for r in rows if r["archivo"] == name]
        print(f"{name}: {mine[0]['producto']}; {sum(1 for r in mine if r['categoria'])} categorías, "
              f"{sum(1 for r in mine if r['sustancia'])} sustancias")
    return 0


if __name__ == "__main__":
    sys.exit(main())
