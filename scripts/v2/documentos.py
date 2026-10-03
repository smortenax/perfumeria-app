# -*- coding: utf-8 -*-
"""Las cifras de un documento de otro proveedor, para traerlas como placeholder (D2, D6).

Solo se leen los documentos que `docs/v2/documentos-ajenos.csv` da por revisados, con el lector
que ese archivo dice. Cada lector devuelve filas `(cas, nombre, valor, tipo)`: el valor, en texto
decimal, y su tipo (`tipico` si el documento da una cifra declarada; `maximo` si dice que son
valores máximos).
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import leer_pw  # noqa: E402


def pw_html(ref: str, root: Path) -> list[tuple[str, str, str, str]]:
    """The «IFRA Restricted materials» table of a PerfumersWorld certificate: a declared figure."""
    lines = leer_pw.text_of(ref)
    rows = leer_pw.table(lines, "IFRA Restricted materials:", ("IFRA Prohibited", "Allergen Declaration"))
    return [(cas, name.title() if name.isupper() else name, pct, "tipico") for name, cas, pct in rows]


def firmenich_alergenos(path: Path) -> list[tuple[str, str, str, str]]:
    """The Total column of a Firmenich «Presence of EU Fragrance Allergens»: historical maxima."""
    from pypdf import PdfReader

    text = "\n".join((page.extract_text() or "") for page in PdfReader(str(path)).pages)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    rows = []
    for i, line in enumerate(lines):
        match = re.match(r"CAS#\s*([\d-]+)", line)
        if not match or i + 1 >= len(lines):
            continue
        values = re.findall(r"(-|\d+\.\d+%)", lines[i + 1])
        total = values[-1] if values else "-"
        if total != "-":
            rows.append((match.group(1), lines[i - 1], total.rstrip("%"), "maximo"))
    return rows


def givaudan_alergenos(path: Path) -> list[tuple[str, str, str, str]]:
    """The «Maximum % in the substance» of a Givaudan extended allergen list: maxima by GC-MS."""
    from pypdf import PdfReader

    text = "\n".join((page.extract_text() or "") for page in PdfReader(str(path)).pages)
    rows = []
    for line in (l.strip() for l in text.splitlines()):
        match = re.match(r"^(\d{2,7}-\d{2}-\d)(?:/[\d\s/-]*)?\s+(.+?)\s+(\d+(?:\.\d+)?)$", line)
        if match:
            rows.append((match.group(1), match.group(2).title(), match.group(3), "maximo"))
    return rows


def transcrito(ref: str, root: Path) -> list[tuple[str, str, str, str]]:
    """A document the script cannot read (an encrypted PDF), transcribed by hand with its source
    in docs/v2/documentos-transcritos.csv, the way docs/proveedores/certificados/transcripciones.csv does."""
    import csv

    with (root / "docs" / "v2" / "documentos-transcritos.csv").open(encoding="utf-8", newline="") as f:
        return [(r["cas"], r["sustancia"], r["valor"], r["tipo"]) for r in csv.DictReader(f) if r["documento"] == ref]


def filas(reader: str, ref: str, path: str, root: Path) -> list[tuple[str, str, str, str]]:
    if reader == "pw-html":
        return pw_html(ref, root)
    if reader == "firmenich-alergenos":
        return firmenich_alergenos(root / path)
    if reader == "givaudan-alergenos":
        return givaudan_alergenos(root / path)
    if reader == "transcrito":
        return transcrito(ref, root)
    return []
