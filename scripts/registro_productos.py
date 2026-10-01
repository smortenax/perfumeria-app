#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""El registro de los productos del usuario: qué es cada uno y qué documentos tiene (P62).

Lee `docs/proveedores/mis-productos.csv`, que mantiene el usuario (producto, tienda, página de la
tienda, dilución), y escribe `docs/proveedores/registro.csv` y `registro.md`. Para cada producto:

* **Qué es** (la criba): `molécula` si su CAS es una molécula del glosario, `natural` si es un
  natural, y `base o especialidad` si no tiene CAS (una mezcla del fabricante).
* **Su fila del glosario** y su estado IFRA general, por el CAS que da la tienda.
* **Sus documentos**, los que enlaza la página de la tienda y están en la caché de
  `traer_proveedores.py`: certificado IFRA, ficha de seguridad (FDS) y declaración de alérgenos.
* **El fabricante y su código**, leídos del certificado o de la ficha.
* **Lo que dice el certificado:** cuántas sustancias declara en su lista de restringidas (o si
  dice expresamente que ninguna) y su tope para la categoría 4, que puede venir sin sustancias (la
  evaluación del propio fabricante: el Ambrinol S de Symrise, 0,0082 %).
* **El estado** (el tick de P62): `documentado` si el certificado se lee; `parcial` si solo hay
  ficha o alérgenos, o el certificado no se lee; `sin documentos` si no hay nada.
* **Qué pedir:** el certificado IFRA, imprescindible en un natural o una base; en una molécula,
  conveniente si el fabricante puede ponerle un tope propio.

Uso:  python scripts/registro_productos.py
Necesita `pypdf`.
"""
import csv
import logging
import re
import sys
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / "docs" / "proveedores"
CACHE = ROOT / "datos" / "glosario" / ".cache" / "proveedores"
SHOP_DIRS = {"Perfumiarz": "perfumiarz", "Maese Lab": "maeselab", "Olfatorium": "olfatorium"}
SHOP_URLS = {"Perfumiarz": "https://perfumiarz.com/products/", "Maese Lab": "https://maeselab.com/", "Olfatorium": "https://olfatorium.com/"}
MAKERS = [("Firmenich", r"firmenich"), ("Givaudan", r"givaudan"), ("IFF", r"\bIFF\b|International Flavors"),
          ("Symrise", r"symrise|Saddle Brook"), ("BASF", r"\bBASF\b"), ("PCW", r"\bPCW\b|pcwfrance"),
          ("Synarome", r"synarome"), ("Takasago", r"takasago"), ("Kao", r"\bKao\b"), ("DSM-Firmenich", r"dsm-firmenich")]
# A substance line: its name, its CAS and its amount; IFF writes the amount without «%».
CAS_LINE = re.compile(r"^(.+?)\s+(\d{2,7}-\d{2}-\d),?\s+(<?\s*\d+(?:[.,]\d+)?)\s*%?\s*$")
NONE_SAID = re.compile(r"No substances to declare|does not contain any substances? restricted|Does not contain any substance restricted|none components|No restricted materials", re.I)
logging.disable(logging.CRITICAL)


def text_of(pdf: Path) -> str | None:
    try:
        return "\n".join(page.extract_text() or "" for page in PdfReader(pdf).pages)
    except Exception:  # an encrypted or broken PDF: it cannot be read here
        return None


def kind_of(name: str, text: str | None) -> str:
    low = name.lower()
    if "ifra" in low:
        return "certificado"
    if any(k in low for k in ("fds", "sds", "karta", "msds", "safety")):
        return "ficha"
    if any(k in low for k in ("alg", "allergen", "alergen", "cosm")):
        return "alérgenos"
    head = (text or "")[:1500].lower()
    if "ifra" in head and "certificat" in head:
        return "certificado"
    if "safety data sheet" in head or "fiche de données" in head or "ficha de datos" in head:
        return "ficha"
    return "otro"


def category_4(text: str) -> str:
    lines = [" ".join(l.split()) for l in text.splitlines()]
    for i, line in enumerate(lines):
        # Firmenich: «4 Products related to fine fragrance 9.6296%»; Symrise: «Category 4 0.0082 %».
        m = re.match(r"^(?:Category\s+)?4\s+(?:Products related to fine fragrance|Hydroalcoholic.*?)?\s*((?:\d+[.,]?\d*)\s*%|No Restriction|Not Permitted)\s*$", line)
        if m:
            return m.group(1).replace(" ", "")
        if re.match(r"^4\s+Hydroalcoholic", line):
            for nxt in lines[i:i + 4]:
                found = re.search(r"(\d+(?:[.,]\d+)?)\s*$", nxt)
                if found:
                    return found.group(1) + " %"
    m = re.search(r"Category 4\s+(\d+[.,]?\d*)\s*%", text)
    return (m.group(1) + " %") if m else ""


def main() -> int:
    with (FOLDER / "mis-productos.csv").open(encoding="utf-8", newline="") as f:
        products = list(csv.DictReader(f))
    with (ROOT / "datos" / "glosario" / "materiales.csv").open(encoding="utf-8", newline="") as f:
        materials = list(csv.DictReader(f))
    with (ROOT / "datos" / "glosario" / "origen" / "nombres-proveedores.csv").open(encoding="utf-8", newline="") as f:
        shop_rows = list(csv.DictReader(f))
    out = []
    for p in products:
        shop, page = p["tienda"], p["pagina"]
        html_path = CACHE / SHOP_DIRS.get(shop, "-") / "paginas" / f"{page}.html"
        html = html_path.read_text(encoding="utf-8", errors="ignore") if page and html_path.exists() else ""
        url = f"{SHOP_URLS.get(shop, '')}{page}" if page else ""
        row = next((r for r in shop_rows if r["proveedor"] == shop and page and r["url"].rstrip("/").split("/")[-1] == page), None)
        cas = row["cas"] if row else ""
        mats = [m for m in materials if cas and (m["cas"] == cas or cas in m["otros_cas"].split())]
        cls = "base o especialidad" if not cas else ("natural" if any(m["clase"] == "natural" for m in mats) else "molécula" if mats else "sin fila en el glosario")
        docs = sorted(set(re.findall(r"files/([^\"?]+\.pdf)", html)))
        kinds: dict[str, list[str]] = {}
        texts: dict[str, str | None] = {}
        for d in docs:
            path = CACHE / SHOP_DIRS[shop] / "documentos" / d
            texts[d] = text_of(path) if path.exists() else None
            kinds.setdefault(kind_of(d, texts[d]), []).append(d)
        cert = next(iter(kinds.get("certificado", [])), None)
        cert_text = texts.get(cert) if cert else None
        all_text = "\n".join(t for t in texts.values() if t)
        maker = next((name for name, pat in MAKERS if re.search(pat, cert_text or "", re.I)), "") or \
            next((name for name, pat in MAKERS if re.search(pat, all_text, re.I)), "")
        listed, said_none, cat4 = 0, False, ""
        if cert_text:
            lines = [" ".join(l.split()) for l in cert_text.splitlines()]
            listed = len({m.group(2) for m in (CAS_LINE.match(l) for l in lines) if m})
            said_none = NONE_SAID.search(cert_text) is not None
            cat4 = category_4(cert_text)
        if cert and cert_text is not None:
            state = "documentado"
        elif docs:
            state = "parcial"
        else:
            state = "sin documentos"
        if state == "documentado":
            ask = ""
        elif cls in ("natural", "base o especialidad"):
            ask = "pedir el certificado IFRA: sin él no se sabe qué lleva"
        else:
            ask = "pedir el certificado IFRA: para impurezas y el tope del fabricante"
        if cert and cert_text is None:
            ask = "el certificado está cifrado o no se lee: " + ask if ask else "el certificado está cifrado o no se lee"
        out.append({
            "producto": p["producto"], "tienda": shop, "url": url, "dilucion": f"{p['dilucion_pct']} % en {p['diluyente'] or '¿?'}" if p["dilucion_pct"] else "",
            "clase": cls, "cas": cas, "glosario": " | ".join(f"{m['id']} {m['nombre']} [{m['estado']}]" for m in mats[:3]),
            "fabricante": maker, "certificado": cert or "", "ficha": " ".join(kinds.get("ficha", [])),
            "alergenos": " ".join(kinds.get("alérgenos", [])),
            "sustancias_declaradas": "ninguna, lo dice" if (cert_text and listed == 0 and said_none) else (str(listed) if cert_text else ""),
            "tope_cat4": cat4, "estado": state, "pedir": ask, "notas": p["notas"],
        })
    with (FOLDER / "registro.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(out[0].keys()), lineterminator="\n")
        w.writeheader()
        w.writerows(out)
    mark = {"documentado": "✓", "parcial": "◐", "sin documentos": "—"}
    lines = ["# Registro de mis productos", "",
             "Lo genera `scripts/registro_productos.py` desde [`mis-productos.csv`](mis-productos.csv). **No se edita a mano.**",
             "✓ documentado (certificado IFRA legible) · ◐ parcial · — sin documentos.", "",
             "| | Producto | Qué es | Glosario | Fabricante | Sustancias del certificado | Tope cat. 4 | Pedir |",
             "|---|---|---|---|---|---|---|---|"]
    for r in sorted(out, key=lambda r: (r["estado"] != "documentado", r["clase"], r["producto"])):
        lines.append(f"| {mark[r['estado']]} | {r['producto']}{' (' + r['dilucion'] + ')' if r['dilucion'] else ''} | {r['clase']} | "
                     f"{r['glosario'].split(' | ')[0] if r['glosario'] else '—'} | {r['fabricante'] or '¿?'} | {r['sustancias_declaradas'] or '—'} | "
                     f"{r['tope_cat4'] or '—'} | {r['pedir'] or ''} |")
    counts = {s: sum(1 for r in out if r["estado"] == s) for s in mark}
    lines += ["", f"**{counts['documentado']} documentados, {counts['parcial']} parciales, {counts['sin documentos']} sin documentos**, de {len(out)}."]
    (FOLDER / "registro.md").write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    print(lines[-1])
    return 0


if __name__ == "__main__":
    sys.exit(main())
