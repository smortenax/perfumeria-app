# -*- coding: utf-8 -*-
"""El cotejo de los certificados de los productos documentados contra su PDF (D6).

`docs/proveedores/productos.csv` y `productos-sustancias.csv` los escribe `registro_productos.py`, que lee cada
certificado con su lector. Antes de que sus cifras entren en la v2, este cotejo las comprueba **contra el texto
del PDF, sin usar ese lector**: cada sustancia declarada (su CAS) tiene que estar en el PDF, con su cifra (la
cota «<» se cuenta por su valor), y el tope de la categoría 4, si lo hay, también. Un certificado cotejado entero
es `revisado: si`; uno que no se puede leer o al que le falta algo es `revisado: no`, con su motivo, y no entra.

No sustituye a leer el documento: comprueba que la transcripción dice lo que dice el PDF, no que el PDF
sea del producto (eso lo dice el nombre del certificado, que se escribe aquí para que se vea).

Escribe `docs/v2/certificados-productos.csv`. Uso:  python scripts/v2/cotejar_certificados.py
"""
import csv
import logging
import re
import sys
from fractions import Fraction
from pathlib import Path

logging.disable(logging.CRITICAL)
ROOT = Path(__file__).resolve().parents[2]
PROV = ROOT / "docs" / "proveedores"
CACHE = ROOT / "datos" / "glosario" / ".cache" / "proveedores" / "perfumiarz" / "documentos"
OUT = ROOT / "docs" / "v2" / "certificados-productos.csv"
COLUMNS = ["producto", "ref", "tipo", "titulo", "emisor", "fecha", "ruta", "revisado", "motivo", "cobertura", "prueba"]
# What proves that a certificate which lists no substance has an empty list: its own words (header with no rows, «None»).
EMPTY = re.compile(r"(does not contain any substances? restricted|contains no substances restricted|no substances to declare|"
                   r"none components|2\.2\.?\s*Ingredients and substances subject[^\n]*\n(?:[^\n]*\n){0,2}\s*NONE)", re.I)
NUMBER = re.compile(r"(?<![\d.,])(\d+(?:[.,]\d+)?)(?![\d])")


def rows(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def pdf_text(path: Path) -> str | None:
    try:
        from pypdf import PdfReader

        return "\n".join((page.extract_text() or "") for page in PdfReader(str(path)).pages)
    except Exception:
        return None


def pdf_pages(path: Path) -> list[str]:
    try:
        from pypdf import PdfReader

        return [(page.extract_text() or "") for page in PdfReader(str(path)).pages]
    except Exception:
        return []


def numbers_of(text: str) -> set[Fraction]:
    found = set()
    for m in NUMBER.finditer(text):
        try:
            found.add(Fraction(m.group(1).replace(",", ".")))
        except ValueError:
            pass
    return found


def empty_proof(pages: list[str]) -> str:
    """The phrase and the page that prove the list of restricted substances is empty, or «» if the document has none."""
    for number, text in enumerate(pages, 1):
        m = EMPTY.search(text)
        if m:
            phrase = re.sub(r"\s+", " ", m.group(0)).strip()[:160]
            return f"«{phrase}» (p. {number})"
    return ""


def main() -> int:
    products = rows(PROV / "productos.csv")
    substances: dict[str, list[dict[str, str]]] = {}
    for r in rows(PROV / "productos-sustancias.csv"):
        substances.setdefault(r["producto"], []).append(r)
    out = []
    for p in products:
        path = CACHE / p["documento"]
        shown = f"datos/glosario/.cache/proveedores/perfumiarz/documentos/{p['documento']}"
        if not path.exists():
            path = PROV / "certificados" / p["documento"]
            shown = f"docs/proveedores/certificados/{p['documento']}"
        base = {"producto": p["producto"], "ref": p["id"], "tipo": "certificado-ifra", "emisor": p["fabricante"], "fecha": "",
                "titulo": f"IFRA certificate — {p['nombre_certificado'] or p['producto']}" + (f" ({p['codigo']})" if p["codigo"] else ""),
                "ruta": shown}
        text = pdf_text(path) if path.exists() else None
        by_hand = next((t for t in rows(PROV / "certificados" / "transcripciones.csv") if t["documento"] == p["documento"]), None)
        if text is None and by_hand:
            # An encrypted PDF the user opened and transcribed himself, with its source (transcripciones.csv).
            out.append({**base, "revisado": "si", "cobertura": "reguladas-completa", "prueba": "su lista de sustancias",
                        "motivo": "Transcrito a mano por el usuario (el PDF tiene cifrado y el script no lo lee): " + by_hand["fuente"][:230]})
            continue
        if text is None:
            out.append({**base, "revisado": "no", "cobertura": "", "prueba": "",
                        "motivo": "El PDF no se puede leer con el script (cifrado o roto): hay que leerlo a mano."})
            continue
        found = numbers_of(text)
        flat = text.replace("\n", " ")
        missing = []
        wanted = substances.get(p["id"], [])
        for s in wanted:
            cas_ok = any(c in flat for c in (s["cas_todos"].split() or [s["cas"]]))
            value_ok = Fraction(s["pct"]) in found
            if not (cas_ok and value_ok):
                missing.append(f"{s['sustancia']} ({s['cas']}, {s['pct']} %): {'sin CAS' if not cas_ok else 'sin cifra'}")
        cap = p["tope_cat4_pct"]
        if cap and Fraction(cap) not in found:
            missing.append(f"tope de la categoría 4 ({cap} %)")
        if missing:
            out.append({**base, "revisado": "no", "cobertura": "", "prueba": "", "motivo": "Cotejo incompleto: " + "; ".join(missing)})
        else:
            # The list is closed if the certificate lists substances, or says in its own words that it has none.
            proof = "su lista de sustancias" if wanted else empty_proof(pdf_pages(path))
            out.append({**base, "revisado": "si", "cobertura": "reguladas-completa" if proof else "parcial", "prueba": proof,
                        "motivo": (f"Cotejado por script el 2026-10-03 contra el texto del PDF: {len(wanted)} sustancias declaradas"
                                   f"{' y el tope de la categoría 4 (' + cap + ' %)' if cap else ''}, con sus cifras. "
                                   "No es una lectura página a página.")})
    with OUT.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(out)
    ok = sum(1 for r in out if r["revisado"] == "si")
    print(f"{ok} de {len(out)} certificados cotejados.")
    for r in out:
        if r["revisado"] == "no":
            print(f"  {r['producto']}: {r['motivo'][:200]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
