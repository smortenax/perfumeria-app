#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""El registro de los productos del usuario, y sus datos para el glosario (P62).

Lee `docs/proveedores/mis-productos.csv`, que mantiene el usuario (producto, tienda, página de la
tienda, dilución en que lo compra, y un `documento` propio si lo consiguió por contacto, en
`docs/proveedores/certificados/`), y escribe en `docs/proveedores/`:

* `registro.csv` y `registro.md`: qué es cada producto (la criba: `molécula`, `natural`, `base o
  especialidad` si no tiene CAS), su fila del glosario, sus documentos, el fabricante, lo que
  declara su certificado, su estado y qué pedir. **El estado es el tick de P62:** `documentado` si
  tiene un certificado IFRA legible y que es suyo; `parcial` si solo hay ficha, alérgenos, o un
  certificado que no se lee o es de otro producto; `sin documentos`.
* `productos.csv` y `productos-sustancias.csv`: los productos documentados, que
  `generar_glosario.py` da de alta como materiales de su fabricante, y las sustancias de su lista
  de restringidas (la 2.2 de Firmenich, o la de cada formato: `scripts/certificados_lib.py`).

**Reglas** (P62, 2026-10-02):
* **Un certificado solo es del producto** si su nombre de producto comparte una palabra con el de
  la tienda, o si declara el CAS del producto: Perfumiarz enlaza en el Calone el certificado de
  «BRAN ABS LMR», y no vale.
* **Siempre en materia pura.** Si el nombre del producto del certificado dice que es una dilución
  («10% IPM»), sus cantidades se dividen entre esa fracción y su tope se multiplica por ella. El
  usuario pone la dilución en la barra al pesar. «NEAT», «ABS.» o un nombre sin % son puros.
* **Una cantidad «<0,1» se cuenta 0,1**, el peor caso, marcada como cota.
* **El tope del fabricante para la categoría 4** se guarda como número cuando lo es: la app lo
  aplica a la sustancia del producto (su CAS), sumada de todo lo que la contiene, nunca al frasco
  del producto solo. «No Restriction» no es un tope.

Uso:  python scripts/registro_productos.py
Necesita `pypdf`.
"""
import csv
import re
import sys
from fractions import Fraction
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import certificados_lib as certs  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / "docs" / "proveedores"
CACHE = ROOT / "datos" / "glosario" / ".cache" / "proveedores"
SHOP_DIRS = {"Perfumiarz": "perfumiarz", "Maese Lab": "maeselab", "Olfatorium": "olfatorium"}
SHOP_URLS = {"Perfumiarz": "https://perfumiarz.com/products/", "Maese Lab": "https://maeselab.com/", "Olfatorium": "https://olfatorium.com/"}
STOP = {"pure", "natural", "nat", "abs", "absolute", "oil", "ipm", "dpg", "in", "powder", "the", "resinoid", "resinoide", "g", "type", "lmr"}


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


def words(text: str) -> set[str]:
    return {w for w in re.findall(r"[a-z]{3,}", text.lower()) if w not in STOP}


def number(text: str) -> Fraction | None:
    m = re.fullmatch(r"(\d+(?:[.,]\d+)?)%", text.replace(" ", ""))
    return Fraction(m.group(1).replace(",", ".")) if m else None


def decimal(x: Fraction) -> str:
    return f"{float(x):.6f}".rstrip("0").rstrip(".")


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def main() -> int:
    with (FOLDER / "mis-productos.csv").open(encoding="utf-8", newline="") as f:
        products = list(csv.DictReader(f))
    with (ROOT / "datos" / "glosario" / "materiales.csv").open(encoding="utf-8", newline="") as f:
        materials = [m for m in csv.DictReader(f) if not m["id"].startswith("prod:")]
    with (ROOT / "datos" / "glosario" / "origen" / "nombres-proveedores.csv").open(encoding="utf-8", newline="") as f:
        shop_rows = list(csv.DictReader(f))
    out, made, made_subs = [], [], []
    for p in products:
        shop, page = p["tienda"], p["pagina"]
        html_path = CACHE / SHOP_DIRS.get(shop, "-") / "paginas" / f"{page}.html"
        html = html_path.read_text(encoding="utf-8", errors="ignore") if page and html_path.exists() else ""
        url = f"{SHOP_URLS.get(shop, '')}{page}" if page else ""
        row = next((r for r in shop_rows if r["proveedor"] == shop and page and r["url"].rstrip("/").split("/")[-1] == page), None)
        cas = row["cas"] if row else ""
        mats = [m for m in materials if cas and (m["cas"] == cas or cas in m["otros_cas"].split())]
        general = next((m for m in mats if m["cas"] == cas), mats[0] if mats else None)
        cls = "base o especialidad" if not cas else ("natural" if general and general["clase"] == "natural" else "molécula" if general else "sin fila en el glosario")

        docs = [(d, CACHE / SHOP_DIRS[shop] / "documentos" / d) for d in sorted(set(re.findall(r"files/([^\"?]+\.pdf)", html)))]
        if p.get("documento"):
            docs.insert(0, (Path(p["documento"]).name, FOLDER / "certificados" / p["documento"]))
        kinds: dict[str, list[str]] = {}
        texts: dict[str, str | None] = {}
        for name, path in docs:
            texts[name] = certs.text_of(path) if path.exists() else None
            kinds.setdefault(kind_of(name, texts[name]), []).append(name)
        cert = next(iter(kinds.get("certificado", [])), None)
        parsed = certs.parse(texts[cert]) if cert and texts.get(cert) else None
        # The certificate has to be this product's: a word of its name, or the product's own CAS.
        own = parsed is not None and (bool(words(parsed["product"]) & words(p["producto"])) or
                                      any(cas in s["cas"] for s in parsed["substances"]))
        maker = (parsed or {}).get("maker", "") or next((n for n, pat in certs.MAKERS if any(re.search(pat, t or "", re.I) for t in texts.values())), "")
        if parsed and own:
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
        if cert and parsed is None:
            ask = f"el certificado ({cert}) está cifrado o no se lee; " + ask
        elif parsed and not own:
            ask = f"el certificado que enlaza la tienda es de otro producto («{parsed['product']}»); " + ask

        listed = ""
        if parsed and own:
            pid = f"prod:{slug(maker or shop)}-{slug(parsed['code'] or page or p['producto'])}"
            dil = Fraction(parsed["dilution"]) / 100 if parsed["dilution"] else Fraction(1)
            cap = number(parsed["cat4"])
            made.append({
                "id": pid, "producto": p["producto"], "fabricante": maker, "codigo": parsed["code"],
                "nombre_certificado": parsed["product"], "tienda": shop, "url": url, "documento": cert,
                "cas": cas, "general": general["id"] if general else "", "clase": cls,
                "tope_cat4_pct": decimal(min(cap * dil, Fraction(100))) if cap is not None else "",
                "tope_texto": parsed["cat4"], "sin_restringidas": "sí" if parsed["none_declared"] else "",
                "dilucion_certificado_pct": parsed["dilution"],
            })
            for s in parsed["substances"]:
                value = Fraction(s["value"]) / dil
                made_subs.append({"producto": pid, "sustancia": s["name"].title(), "cas": s["cas"][0], "cas_todos": " ".join(s["cas"]),
                                  "pct": decimal(min(value, Fraction(100))), "cota": "sí" if s["bound"] else ""})
            listed = "ninguna, lo dice" if parsed["none_declared"] else str(len(parsed["substances"]))
        out.append({
            "producto": p["producto"], "tienda": shop, "url": url,
            "dilucion": f"{p['dilucion_pct']} % en {p['diluyente'] or '¿?'}" if p["dilucion_pct"] else "",
            "clase": cls, "cas": cas, "glosario": " | ".join(f"{m['id']} {m['nombre']} [{m['estado']}]" for m in mats[:3]),
            "fabricante": maker, "codigo": (parsed or {}).get("code", ""), "certificado": cert or "",
            "ficha": " ".join(kinds.get("ficha", [])), "alergenos": " ".join(kinds.get("alérgenos", [])),
            "sustancias_declaradas": listed, "tope_cat4": (parsed or {}).get("cat4", "") if own else "",
            "estado": state, "pedir": ask, "notas": p["notas"],
        })

    def write(name: str, rows: list[dict], header: list[str]) -> None:
        with (FOLDER / name).open("w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=header, lineterminator="\n")
            w.writeheader()
            w.writerows(rows)

    write("registro.csv", out, list(out[0].keys()))
    write("productos.csv", made, ["id", "producto", "fabricante", "codigo", "nombre_certificado", "tienda", "url", "documento", "cas",
                                  "general", "clase", "tope_cat4_pct", "tope_texto", "sin_restringidas", "dilucion_certificado_pct"])
    write("productos-sustancias.csv", made_subs, ["producto", "sustancia", "cas", "cas_todos", "pct", "cota"])
    mark = {"documentado": "✓", "parcial": "◐", "sin documentos": "—"}
    lines = ["# Registro de mis productos", "",
             "Lo genera `scripts/registro_productos.py` desde [`mis-productos.csv`](mis-productos.csv). **No se edita a mano.**",
             "✓ documentado (certificado IFRA legible y del producto) · ◐ parcial · — sin documentos.", "",
             "| | Producto | Qué es | Glosario | Fabricante | Sustancias del certificado | Tope cat. 4 | Pedir |",
             "|---|---|---|---|---|---|---|---|"]
    for r in sorted(out, key=lambda r: (r["estado"] != "documentado", r["clase"], r["producto"])):
        lines.append(f"| {mark[r['estado']]} | {r['producto']}{' (' + r['dilucion'] + ')' if r['dilucion'] else ''} | {r['clase']} | "
                     f"{r['glosario'].split(' | ')[0] if r['glosario'] else '—'} | {r['fabricante'] or '¿?'} | {r['sustancias_declaradas'] or '—'} | "
                     f"{r['tope_cat4'] or '—'} | {r['pedir']} |")
    counts = {s: sum(1 for r in out if r["estado"] == s) for s in mark}
    lines += ["", f"**{counts['documentado']} documentados, {counts['parcial']} parciales, {counts['sin documentos']} sin documentos**, de {len(out)}."]
    (FOLDER / "registro.md").write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    print(lines[-1], f"· {len(made)} productos, {len(made_subs)} sustancias")
    return 0


if __name__ == "__main__":
    sys.exit(main())
