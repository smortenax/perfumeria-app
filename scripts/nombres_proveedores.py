#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Los nombres con que las tiendas venden cada material, por CAS.

Lee la caché de `scripts/traer_proveedores.py` y escribe
`datos/glosario/origen/nombres-proveedores.csv`, que sí va en Git: así el glosario se
regenera sin red. Una fila por producto y CAS:

- `cas`: el CAS, con su cifra de control comprobada. «8002-03-07» es el 8002-03-7;
- `nombre`: el nombre del producto en la tienda, sin marcas de registro ni coletillas de
  venta («100% Natural»);
- `clase`: natural o molécula, según la categoría de la tienda; en blanco si no lo dice;
- `tipo`: para un natural, cómo se obtiene, si la tienda lo dice: aceite, absoluto, CO2,
  resinoide, concreto, tintura. Sirve para unirlo a la fila del glosario de ese tipo, porque
  el CAS de un natural es el de la planta y lo comparten el aceite y el absoluto;
- `inci`: el nombre INCI, si la tienda lo da. Su especie botánica une un natural cuyo CAS
  no está en el glosario;
- `proveedor`, `categoria` y `url`: de dónde sale.

Quedan fuera los productos que no son materias de perfumería (frascos, aceites vegetales,
cosmética) y, en una dilución, el CAS del disolvente.
Uso:  python scripts/nombres_proveedores.py
"""
import csv
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "datos" / "glosario" / ".cache" / "proveedores"
OUT = ROOT / "datos" / "glosario" / "origen" / "nombres-proveedores.csv"

CAS = re.compile(r"\b0*(\d{2,7})-0?(\d{2})-0?(\d)\b")
# The solvents of a dilution: ethanol, DPG, TEC, IPM, benzyl benzoate, IPA, water.
SOLVENTS = {"64-17-5", "25265-71-8", "110-98-5", "77-93-0", "110-27-0", "120-51-4", "67-63-0", "7732-18-5", "57-55-6", "56-81-5"}

# The categories of each shop that hold perfumery materials.
MAESELAB_KEEP = {"Absolutos, CO2, Resinoides y Reducciones", "Aceites esenciales", "Aroma Chemicals, Fracciones y Moléculas",
                 "Tinturas y Extractos Vegetales", "Esencia Aromática, Acorde de Perfumería Base"}
OLFATORIUM_DROP = {"Material de laboratorio", "Frascos y viales", "Kits de perfumista", "Cursos presenciales en Barcelona",
                   "Alcohol y solventes"}


def valid(head: str, middle: str, check: str) -> str | None:
    digits = f"{head}{middle}"[::-1]
    total = sum(int(d) * (i + 1) for i, d in enumerate(digits))
    return f"{head}-{middle}-{check}" if total % 10 == int(check) else None


def cas_list(text: str) -> list[str]:
    found = [valid(*m.groups()) for m in CAS.finditer(text)]
    out = list(dict.fromkeys(c for c in found if c))
    # A dilution carries its solvent's CAS: it is not the material.
    material = [c for c in out if c not in SOLVENTS]
    return material or out


def kind_of(text: str) -> str:
    t = text.lower()
    for kind, pattern in (("co2", r"\bco2\b|supercr|\bsfe\b"), ("absolute", r"\babs\.|absolut"), ("concrete", r"concret"),
                          ("resinoid", r"resinoid"), ("tincture", r"tintura|tincture"), ("oleoresin", r"oleorresina|oleoresin"),
                          ("oil", r"aceite esencial|\boil\b|arrastre de vapor|destilaci|expresi|presi[oó]n en fr[ií]o|essential")):
        if re.search(pattern, t):
            return kind
    return ""


def clean(name: str) -> str:
    name = html.unescape(re.sub(r"<[^>]+>", "", name))
    name = re.sub(r"[®™©\ufffd]", "", name)
    name = re.sub(r"\s*[-–]?\s*\(?\s*100\s*%\s*(natural|puro|pure)\s*\)?", "", name, flags=re.I)
    return re.sub(r"\s+", " ", name).strip(" -–")


def page_text(h: str) -> str:
    h = re.sub(r"<script.*?</script>|<style.*?</style>|<!--.*?-->", "", h, flags=re.S)
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)))


def olfatorium() -> list[dict]:
    rows = []
    for f in sorted((CACHE / "olfatorium").glob("api-*.json")):
        for p in json.loads(f.read_text(encoding="utf-8")):
            cats = [html.unescape(c["name"]) for c in p["categories"]]
            if set(cats) & OLFATORIUM_DROP:
                continue
            cas_text = " ".join(t["name"] for a in p.get("attributes", []) if a["name"].startswith("CAS") for t in a["terms"])
            name = clean(p["name"])
            kind = "oil" if "Aceites esenciales" in cats else "co2" if "Extractos CO2" in cats else kind_of(name)
            natural = bool(kind) or bool({"Aceites esenciales", "Extractos CO2", "Resinas y bálsamos"} & set(cats))
            clase = "natural" if natural else "molécula" if "Moléculas sintéticas" in cats else ""
            for cas in cas_list(cas_text):
                rows.append({"cas": cas, "nombre": name, "clase": clase, "tipo": kind, "inci": "", "proveedor": "Olfatorium",
                             "categoria": " · ".join(cats), "url": p["permalink"]})
    return rows


def maeselab() -> list[dict]:
    rows = []
    for f in sorted((CACHE / "maeselab" / "paginas").glob("*.html")):
        h = f.read_text(encoding="utf-8")
        crumbs = [html.unescape(re.sub(r"<[^>]+>", "", x)).strip() for x in re.findall(r'<li class="breadcrumb[^"]*".*?</li>', h, re.S)]
        category = crumbs[2] if len(crumbs) > 2 else ""
        if category not in MAESELAB_KEEP:
            continue
        t = page_text(h)
        h1 = re.search(r"<h1[^>]*>(.*?)</h1>", h, re.S)
        found = re.search(r"N[º°o]\.?\s*CAS:?\s*([^A-Za-z]{0,80})", t)
        if not h1 or not found:
            continue
        name = clean(h1.group(1))
        method = re.search(r"Método de Obtención:\s*(.*?)\s+(?:Parte|Origen|INCI|Aspecto|Nº)", t)
        molecule = category == "Aroma Chemicals, Fracciones y Moléculas"
        kind = "" if molecule else kind_of(f"{method.group(1) if method else ''} {name}")
        clase = "molécula" if molecule else "" if category.startswith("Esencia") else "natural"
        inci = re.search(r"INCI:\s*(.*?)\s+(?:Nº|N°|Pureza|Aspecto|Conservantes)", t)
        url = re.search(r'<link rel="canonical" href="([^"]+)"', h)
        for cas in cas_list(found.group(1)):
            rows.append({"cas": cas, "nombre": name, "clase": clase, "tipo": kind, "inci": inci.group(1).strip() if inci else "",
                         "proveedor": "Maese Lab", "categoria": category,
                         "url": url.group(1) if url else ""})
    return rows


def perfumiarz() -> list[dict]:
    rows = []
    products = [p for f in sorted((CACHE / "perfumiarz").glob("productos-*.json"))
                for p in json.loads(f.read_text(encoding="utf-8"))["products"]]
    for p in products:
        page = CACHE / "perfumiarz" / "paginas" / f"{re.sub(r'[^a-z0-9-]', '_', p['handle'].lower())[:120]}.html"
        if not page.exists():
            continue
        t = page_text(page.read_text(encoding="utf-8"))
        found = re.search(r"CAS\s*(?:#|No\.?|number)?\s*:?\s*([^A-Za-z]{0,80})", t)
        if not found:
            continue
        name = clean(p["title"])
        inci = re.search(r"INCI\s*:?\s*(.*?)\s+(?:NOTE|Note|Odor|ODOR|CAS|$)", t)
        kind = kind_of(name)
        for cas in cas_list(found.group(1)):
            rows.append({"cas": cas, "nombre": name, "clase": "natural" if kind else "", "tipo": kind,
                         "inci": inci.group(1).strip()[:120] if inci else "", "proveedor": "Perfumiarz",
                         "categoria": p.get("product_type", ""), "url": f"https://perfumiarz.com/products/{p['handle']}"})
    return rows


def main() -> None:
    rows = olfatorium() + maeselab() + perfumiarz()
    rows.sort(key=lambda r: (r["proveedor"], r["nombre"].lower(), r["cas"]))
    with OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["cas", "nombre", "clase", "tipo", "inci", "proveedor", "categoria", "url"], lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    shops = {}
    for r in rows:
        shops.setdefault(r["proveedor"], set()).add(r["url"])
    print(f"{OUT.relative_to(ROOT).as_posix()}: {len(rows)} filas, {len({r['cas'] for r in rows})} CAS; "
          + ", ".join(f"{k} {len(v)} productos" for k, v in shops.items()))


if __name__ == "__main__":
    main()
