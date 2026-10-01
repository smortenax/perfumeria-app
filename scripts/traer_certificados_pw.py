#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Los constituyentes regulados que declaran los certificados de PerfumersWorld (frente C, lote C-004).

Cada producto de PerfumersWorld tiene una página pública de documentos
(`document-list.php?pro_id=<SKU>`, permitida por su robots.txt) con su certificado de
conformidad: los topes por categoría, la tabla «IFRA Restricted materials» y la de «IFRA
Prohibited materials», cada sustancia con su CAS y su % en el producto. Es el formato que la app
suma por sustancia (§5.3), como el de Firmenich (P61).

**Qué productos.** Los del catálogo de PerfumersWorld (`product-search.php`, ya en la caché de
U-002) cuyo CAS está en el glosario. Un producto diluido («10% in DPG», «solution») no entra: sus
cifras serían del producto diluido, no del material.

**A qué material va cada producto:**
* una molécula, a los materiales del glosario con ese CAS que son moléculas;
* un natural, a la forma de su nombre («Lavender Oil» al aceite) entre los naturales con ese CAS;
  si el nombre no dice forma, solo si el CAS tiene un único natural. Si no, queda sin asignar,
  nunca a otra forma: los constituyentes cambian con la forma (P54).

**Las filas.** Una por sustancia declarada, con su estándar IFRA (de `datos/ifra/51/estandar-cas.csv`).
La sustancia que es el propio material no se repite. `auditoria` sale por regla: `aceptada` si el
producto se asignó, la cifra se leyó y la sustancia tiene estándar; si no, dice por qué. **El
certificado no manda sobre IFRA:** la app juzga cada sustancia con los estándares (el del Castoreum
Synthetic lista el Lyral como «restringido», y en la 51.ª enmienda está prohibido).

**Educado:** una petición cada 3 s, caché en `datos/glosario/.cache/certificados-pw/` (fuera de
Git), y si contesta 403 o 429 tres veces seguidas se para.

Uso:  python scripts/traer_certificados_pw.py
Solo usa la biblioteca estándar.
"""
import csv
import html
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOTS = ROOT / "docs" / "investigacion" / "2026-09-30-usos-y-constituyentes" / "lotes"
CATALOG = ROOT / "datos" / "glosario" / ".cache" / "usos" / "pw" / "product-search.php"
CACHE = ROOT / "datos" / "glosario" / ".cache" / "certificados-pw"
MATERIALS = ROOT / "datos" / "glosario" / "materiales.csv"
STANDARD_CAS = ROOT / "datos" / "ifra" / "51" / "estandar-cas.csv"
OUT = LOTS / "C-004.csv"
SUMMARY = LOTS / "C-004-resumen.md"
BASE = "https://www.perfumersworld.com/"
UA = "Mozilla/5.0 (perfumeria-app; research, 1 req/3s)"

HEADER = ["material_id", "cas", "nombre", "constituyente", "cas_constituyente", "estandar_ifra", "min_pct", "max_pct",
          "tipo_valor", "fuente", "tipo_fuente", "url", "consultado", "cita", "notas", "auditoria"]
CAS_RE = re.compile(r"^\d{2,7}-\d{2}-\d$")
DILUTED = re.compile(r"\d+\s*%|\bdilut|\bsolution\b|\bin (?:dpg|ipm|tec|ethanol|alcohol)\b", re.I)
PW_FORMS = [("absolute", r"\babs(?:olute)?\b"), ("concrete", r"\bconcrete\b"), ("resinoid", r"\bresinoid\b"),
            ("oleoresin", r"\boleo-?resin\b"), ("tincture", r"\btincture\b"), ("extract", r"\b(?:co2|extract)\b"),
            ("oil", r"\boil\b")]


def form_of(name: str) -> str:
    forms = {f for f, p in PW_FORMS if re.search(p, name, re.I)}
    if len(forms) > 1:
        forms.discard("oil")
    return forms.pop() if len(forms) == 1 else ""


def products() -> list[dict]:
    text = CATALOG.read_text(encoding="utf-8", errors="ignore")
    found = re.findall(r'data-sku="([^"]+)"\s+data-name="([^"]*)".*?data-category="([^"]*)"\s+data-cas-no="([^"]*)"', text, re.S)
    return [{"sku": s, "name": html.unescape(n), "category": c, "cas": [x for x in re.split(r"[,;/\s]+", k) if CAS_RE.match(x)]}
            for s, n, c, k in found]


def fetch(sku: str, state: dict) -> str | None:
    page = CACHE / f"{sku}.html"
    if page.exists():
        return page.read_text(encoding="utf-8", errors="ignore")
    if state["blocked"] >= 3:
        return None
    time.sleep(3)
    req = urllib.request.Request(f"{BASE}document-list.php?pro_id={sku}", headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            body = r.read().decode("utf-8", errors="ignore")
    except urllib.error.HTTPError as e:
        state["blocked"] += e.code in (403, 429)
        return None
    except (urllib.error.URLError, TimeoutError):
        return None
    state["blocked"] = 0
    CACHE.mkdir(parents=True, exist_ok=True)
    page.write_text(body, encoding="utf-8")
    return body


def table(text: str, title: str) -> list[tuple[str, str, str]]:
    """The rows (name, CAS, %) of the certificate table that follows `title`, up to the next heading."""
    at = text.find(title)
    if at < 0:
        return []
    end = min([i for i in (text.find(t, at + len(title)) for t in ("IFRA Prohibited", "Specifications", "Allergen Declaration")) if i > 0] or [len(text)])
    rows = []
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", text[at:end], re.S):
        cells = [" ".join(html.unescape(re.sub(r"<[^>]+>", " ", c)).split()) for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", tr, re.S)]
        if len(cells) >= 3 and CAS_RE.match(cells[1]):
            rows.append((cells[0], cells[1], cells[2]))
    return rows


def main() -> int:
    with MATERIALS.open(encoding="utf-8", newline="") as f:
        materials = list(csv.DictReader(f))
    by_cas: dict[str, list[dict]] = {}
    for m in materials:
        for c in [m["cas"], *m["otros_cas"].split()]:
            if c:
                by_cas.setdefault(c, []).append(m)
    with STANDARD_CAS.open(encoding="utf-8", newline="") as f:
        standard = {r["cas"]: r["estandar"] for r in csv.DictReader(f)}

    chosen = [p for p in products() if any(c in by_cas for c in p["cas"]) and not DILUTED.search(p["name"])]
    print(f"{len(chosen)} productos con CAS del glosario", flush=True)
    state = {"blocked": 0}
    out, unassigned, empty, failed = [], [], 0, 0
    today = date.today().isoformat()
    for n, p in enumerate(chosen, 1):
        text = fetch(p["sku"], state)
        if n % 50 == 0:
            print(f"{n}/{len(chosen)}", flush=True)
        if text is None:
            failed += 1
            continue
        restricted = table(text, "IFRA Restricted materials")
        prohibited = table(text, "IFRA Prohibited materials")
        if not restricted and not prohibited:
            empty += 1
            continue
        targets: list[dict] = []
        for c in p["cas"]:
            group = by_cas.get(c, [])
            mols = [m for m in group if m["clase"] == "molécula"]
            nats = [m for m in group if m["clase"] == "natural"]
            if mols:
                targets += mols
            elif nats:
                form = form_of(p["name"])
                same = [m for m in nats if m["tipo_natural"] == form] if form else []
                targets += same or (nats if len(nats) == 1 else [])
        url = f"{BASE}document-list.php?pro_id={p['sku']}"
        if not targets:
            unassigned.append(p)
            continue
        for m in {m["id"]: m for m in targets}.values():
            for kind, rows in (("restringida", restricted), ("prohibida", prohibited)):
                for name, cas, pct in rows:
                    if cas == m["cas"]:
                        continue
                    value = pct.replace(",", ".")
                    ok_value = re.fullmatch(r"\d+(?:\.\d+)?", value) is not None
                    std = standard.get(cas, "")
                    audit = "aceptada" if ok_value and std else ("sin estándar IFRA" if ok_value else "cifra ilegible")
                    out.append({
                        "material_id": m["id"], "cas": m["cas"], "nombre": m["nombre"], "constituyente": name.title(),
                        "cas_constituyente": cas, "estandar_ifra": std, "min_pct": value if ok_value else "",
                        "max_pct": value if ok_value else "", "tipo_valor": "declarado",
                        "fuente": f"PerfumersWorld: certificado de conformidad de «{p['name']}» ({p['sku']})",
                        "tipo_fuente": "proveedor", "url": url, "consultado": today,
                        "cita": f"{name} {cas} {pct}", "notas": f"tabla «IFRA {kind.capitalize()} materials» del certificado",
                        "auditoria": audit,
                    })
    with OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=HEADER, lineterminator="\n")
        w.writeheader()
        w.writerows(out)
    accepted = [r for r in out if r["auditoria"] == "aceptada"]
    lines = [
        "# C-004: constituyentes de los certificados de PerfumersWorld",
        "",
        f"Generado por `scripts/traer_certificados_pw.py` el {today}. La regla está en su docstring.",
        "",
        f"- Productos con CAS del glosario, sin diluir: {len(chosen)}.",
        f"- Sin certificado con tablas: {empty}. Sin página (error o bloqueo): {failed}.",
        f"- Sin asignar a un material (forma del natural no clara): {len(unassigned)}.",
        f"- Filas: {len(out)}; aceptadas: {len(accepted)}, en {len({r['material_id'] for r in accepted})} materiales.",
        "",
        "## Sin asignar",
        "",
        *[f"- {p['name']} ({p['sku']}, CAS {', '.join(p['cas'])})" for p in unassigned],
    ]
    SUMMARY.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines[4:8]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
