# -*- coding: utf-8 -*-
"""El título y la descripción corta de la página de la tienda de cada producto de un lote.

Es la evidencia para la forma de un natural: se mira solo el `<title>` y la descripción de la
cabecera (`<meta name="description">` o `og:description`), nunca la página entera. De la red se
leen como mucho los primeros 64 KB de cada página; si la página está en la caché de
`datos/glosario/.cache/proveedores/<tienda>/paginas/`, se lee de allí y no se pide nada.

Escribe `datos/v2/paginas-tienda.csv` (una fila por tienda y página, con de dónde salió y cuándo),
que `lote.py` lee: volver a ejecutar el lote no toca la red. Una fila existente no se vuelve a
pedir salvo con `--refrescar`.

Uso:  python scripts/v2/pagina_tienda.py --lote 3c [--refrescar]
"""
import argparse
import csv
import html
import json
import re
import sys
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "datos" / "v2" / "paginas-tienda.csv"
CACHE = ROOT / "datos" / "glosario" / ".cache" / "proveedores"
COLUMNS = ["tienda", "pagina", "url", "titulo", "descripcion", "fuente", "fecha"]
SHOP_SLUG = {"Maese Lab": "maeselab", "Olfatorium": "olfatorium", "Perfumiarz": "perfumiarz"}
SHOP_URL = {"Maese Lab": "https://maeselab.com/", "Olfatorium": "https://olfatorium.com/",
            "Perfumiarz": "https://perfumiarz.com/products/"}
HEAD_BYTES = 64 * 1024

TITLE = re.compile(r"<title[^>]*>(.*?)</title>", re.I | re.S)
META = re.compile(r"<meta\b[^>]*>", re.I | re.S)
ATTR = re.compile(r'([\w:-]+)\s*=\s*("([^"]*)"|\'([^\']*)\')', re.S)


def clean(text: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def parse_head(text: str) -> tuple[str, str]:
    """The title and the short description of a page's head; nothing else of it is read."""
    head = text[: text.lower().find("</head>")] if "</head>" in text.lower() else text[:HEAD_BYTES]
    title = TITLE.search(head)
    description = ""
    for tag in META.findall(head):
        attrs = {k.lower(): (v1 or v2) for k, _, v1, v2 in ATTR.findall(tag)}
        key = (attrs.get("name") or attrs.get("property") or "").lower()
        if key in ("description", "og:description") and attrs.get("content"):
            description = description or attrs["content"]
    return clean(title.group(1)) if title else "", clean(description)


def fetch(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "perfumeria-app (lectura de la cabecera)"})
    with urllib.request.urlopen(request, timeout=20) as response:
        return response.read(HEAD_BYTES).decode("utf-8", errors="replace")


def evidence(shop: str, page: str, refresh: bool, known: dict[tuple[str, str], dict[str, str]]) -> dict[str, str]:
    key = (shop, page)
    if key in known and not refresh and known[key]["fuente"] != "error":
        return known[key]
    url = SHOP_URL.get(shop, "") + page
    cached = CACHE / SHOP_SLUG.get(shop, shop) / "paginas" / f"{page}.html"
    try:
        if cached.exists():
            text, source = cached.read_text(encoding="utf-8", errors="replace"), "caché"
        else:
            text, source = fetch(url), "red"
        title, description = parse_head(text)
    except Exception as error:  # a page that cannot be read is said so, never guessed
        title, description, source = "", f"no se pudo leer: {error}", "error"
    return {"tienda": shop, "pagina": page, "url": url, "titulo": title, "descripcion": description,
            "fuente": source, "fecha": date.today().isoformat()}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lote", required=True)
    parser.add_argument("--refrescar", action="store_true")
    args = parser.parse_args()
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import lote as lots  # noqa: E402

    spec = json.loads((ROOT / "docs" / "v2" / "lotes.json").read_text(encoding="utf-8"))["lotes"][args.lote]
    known = {(r["tienda"], r["pagina"]): r for r in lots.read_csv(OUT)}
    pages = lots.pages_of(spec, ROOT)
    for shop, page in pages:
        known[(shop, page)] = evidence(shop, page, args.refrescar, known)
        row = known[(shop, page)]
        print(f"{page}: [{row['fuente']}] {row['titulo'][:80]} | {row['descripcion'][:100]}")
    lots.write(OUT, COLUMNS, [known[k] for k in sorted(known)])
    return 0


if __name__ == "__main__":
    sys.exit(main())
