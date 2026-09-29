#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Trae los catálogos de las tiendas donde compra el usuario, a la caché.

Las tiendas nombran sus materiales como se compran: «Ambroxan KAO», «Abs. de Gálbano»,
«MDJ HC». Esos nombres, con su CAS, son sinónimos para el buscador. Este script solo trae;
`scripts/nombres_proveedores.py` los lee y escribe el CSV que va en Git.

- **Olfatorium** (olfatorium.com, WooCommerce): su API pública de tienda, con el CAS como
  atributo; y la página de cada producto que no lo trae ahí.
- **Maese Lab** (maeselab.com, BigCommerce): la página de cada producto de su sitemap.
- **Perfumiarz** (perfumiarz.com, Shopify): el listado público de productos y la página de
  cada uno, donde está el CAS.
- **PubChem**, para los CAS de las tiendas que el glosario no tiene: los nombres de uso de su
  sustancia («84929-41-9» es «Black pepper»). Un natural se une así por su nombre común. Se
  corre después de `scripts/nombres_proveedores.py`, que dice qué CAS faltan.

Una página por segundo, y lo que ya está en la caché no se vuelve a pedir. La caché está en
`datos/glosario/.cache/proveedores/`, fuera de Git.
Uso:  python scripts/traer_proveedores.py [olfatorium|maeselab|perfumiarz|pubchem ...]
"""
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "datos" / "glosario" / ".cache" / "proveedores"
AGENT = "Mozilla/5.0 (perfumeria-app; catálogo para buscar por nombre)"


def get(url: str, path: Path) -> str:
    if path.exists():
        return path.read_text(encoding="utf-8")
    time.sleep(1)
    # A handle with ® or ™ goes encoded: «josenol®» is «josenol%C2%AE».
    req = urllib.request.Request(urllib.parse.quote(url, safe=":/?&=%"), headers={"User-Agent": AGENT})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            text = r.read().decode("utf-8", "replace")
    except Exception as e:  # a page that fails is left out, and said
        print(f"  falla {url}: {e}")
        return ""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return text


def slug(url: str) -> str:
    return re.sub(r"[^a-z0-9-]", "_", url.rstrip("/").rsplit("/", 1)[-1].lower())[:120] or "raiz"


def olfatorium() -> None:
    base = CACHE / "olfatorium"
    products = []
    for page in range(1, 20):
        text = get(f"https://olfatorium.com/wp-json/wc/store/v1/products?per_page=100&page={page}", base / f"api-{page}.json")
        items = json.loads(text) if text else []
        if not items:
            break
        products += items
    missing = [p for p in products if not any(a["name"].startswith("CAS") for a in p.get("attributes", []))]
    print(f"olfatorium: {len(products)} productos, {len(missing)} sin CAS en la API")
    for p in missing:
        get(p["permalink"], base / "paginas" / f"{slug(p['permalink'])}.html")


def maeselab() -> None:
    base = CACHE / "maeselab"
    urls = []
    for page in range(1, 10):
        text = get(f"https://maeselab.com/xmlsitemap.php?type=products&page={page}", base / f"sitemap-{page}.xml")
        found = re.findall(r"<loc>(https://maeselab\.com/[^<]+)</loc>", text)
        if not found:
            break
        urls += found
    print(f"maeselab: {len(urls)} productos")
    for i, url in enumerate(urls):
        get(url, base / "paginas" / f"{slug(url)}.html")
        if i % 100 == 99:
            print(f"  {i + 1}")


def perfumiarz() -> None:
    base = CACHE / "perfumiarz"
    products = []
    for page in range(1, 20):
        text = get(f"https://perfumiarz.com/products.json?limit=250&page={page}", base / f"productos-{page}.json")
        items = json.loads(text)["products"] if text else []
        if not items:
            break
        products += items
    print(f"perfumiarz: {len(products)} productos")
    for i, p in enumerate(products):
        get(f"https://perfumiarz.com/products/{p['handle']}", base / "paginas" / f"{slug(p['handle'])}.html")
        if i % 100 == 99:
            print(f"  {i + 1}")


def pubchem() -> None:
    import csv

    origin = ROOT / "datos" / "glosario" / "origen" / "nombres-proveedores.csv"
    known = set()
    for m in csv.DictReader((ROOT / "datos" / "glosario" / "materiales.csv").open(encoding="utf-8")):
        known.update([m["cas"], *m["otros_cas"].split()])
    missing = sorted({r["cas"] for r in csv.DictReader(origin.open(encoding="utf-8"))} - known)
    print(f"pubchem: {len(missing)} CAS de tiendas que el glosario no tiene")
    for cas in missing:
        get(f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/substance/name/{cas}/synonyms/JSON", CACHE / "pubchem" / f"{cas}.json")


SHOPS = {"olfatorium": olfatorium, "maeselab": maeselab, "perfumiarz": perfumiarz, "pubchem": pubchem}

if __name__ == "__main__":
    for name in sys.argv[1:] or [k for k in SHOPS if k != "pubchem"]:
        SHOPS[name]()
