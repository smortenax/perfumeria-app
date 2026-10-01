#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Trae los usos habituales de TGSC y PerfumersWorld por CAS, sin agentes (frente U, lote U-002).

Las dos fuentes tienen un formato fijo que dio casi todo lo util en el piloto U-001:

* **TGSC** (thegoodscentscompany.com): «Recommendation for X usage levels up to: N % in the
  fragrance concentrate». Es un techo (papel `techo`).
* **PerfumersWorld**: «Typical usage in perfume compounds: A% From B% Average C% Maximum».
  Da habitual y techo (papel `habitual y techo`).

**Como se busca por CAS sin tocar lo que prohibe el robots.txt.** El buscador de TGSC
(`/search.php`) esta vetado en su robots.txt, asi que no se usa. En su lugar se leen sus indices
estaticos de CAS (`/allproc-1.html` ... `/allproc-12.html`), que enlazan cada CAS con sus
paginas. En PerfumersWorld, `product-search.php` devuelve el catalogo entero (la busqueda se
filtra en el navegador) con el CAS de cada producto en `data-cas-no`: una sola peticion da el
mapa CAS -> producto. Despues solo se piden las fichas de los materiales que tienen pagina.

**Educado:** una peticion cada 3 s por sitio (los dos sitios corren a la vez), cache en
`datos/glosario/.cache/usos/` (fuera de Git) para no pedir dos veces, solo paginas HTML, y si
un sitio contesta 403 o 429 varias veces seguidas se deja de pedirle.

**Reglas de las filas** (mismas columnas que U-001.csv):

* La pagina es de ese CAS solo si el CAS sale en el texto de la pagina.
* `auditoria` = `aceptada` solo si el CAS coincide y la cifra se leyo entera (en PerfumersWorld:
  minimo, medio y maximo, los tres positivos y en orden).
* `forma ambigua` si el CAS no identifica una sola forma: un natural con varias paginas en la
  fuente, o un natural cuyo CAS comparten varios materiales del glosario (las formas de una
  planta). Una molecula con varias paginas del mismo CAS solo se acepta si todas dan la misma
  cifra.
* Nada se estima ni se convierte: la base es `concentrado` porque asi lo dice la frase.

Uso:  python scripts/traer_usos.py [--fase 1|2|todas]
Solo usa la biblioteca estandar.
"""
import argparse
import csv
import hashlib
import html
import re
import sys
import threading
import time
import urllib.error
import urllib.request
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BATCHES = ROOT / "docs" / "investigacion" / "2026-09-30-usos-y-constituyentes" / "lotes"
OUT = BATCHES / "U-002.csv"
SEARCH_OUT = BATCHES / "U-002-busqueda.csv"
PILOT = BATCHES / "U-001.csv"
MATERIALS = ROOT / "datos" / "glosario" / "materiales.csv"
CACHE = ROOT / "datos" / "glosario" / ".cache" / "usos"

USER_AGENT = "perfumeria-app-research/1.0 (personal formulation tool; polite, 1 request / 3 s, cached)"
DELAY = 3.0

TGSC = "https://www.thegoodscentscompany.com"
TGSC_INDEXES = [f"/allproc-{n}.html" for n in range(1, 13)]
PW = "https://www.perfumersworld.com"
PW_CATALOG = "/product-search.php"

HEADER = ["material_id", "cas", "nombre", "fuente", "tipo_fuente", "url", "consultado", "cita", "min_pct",
          "max_pct", "base", "notas", "auditoria", "papel"]
SEARCH_HEADER = ["material_id", "cas", "clase", "fase", "tgsc_paginas", "tgsc_estado", "pw_paginas", "pw_estado"]

CAS_RE = re.compile(r"(?<![\d-])\d{2,7}-\d\d-\d(?![\d-])")
TGSC_ROW = re.compile(r"<tr><td>(\d{2,7}-\d\d-\d)</td>\s*<td>(.*?)</td></tr>", re.S)
TGSC_LINK = re.compile(r"openMainWindow\('(/data/[^']+)'\)[^>]*>([^<]*)</a>")
TGSC_FIG = re.compile(r"Recommendation for (.{1,120}?) usage levels up to:\s*([0-9]+(?:\.[0-9]+)?)\s*%\s*in the fragrance concentrate\.?")
PW_CARD = re.compile(r'data-sku="([A-Za-z0-9]+)"\s+data-name="([^"]*)"')
PW_FIG = re.compile(r"Typical usage in perfume compounds:\s*([0-9]+(?:\.[0-9]+)?)\s*%\s*From\s*([0-9]+(?:\.[0-9]+)?)\s*%\s*Average\s*([0-9]+(?:\.[0-9]+)?)\s*%\s*Maximum")


# ----------------------------------------------------------------------------------- fetching

class Site:
    """One polite client per site: a single request every DELAY seconds, cached on disk."""

    def __init__(self, key: str, base: str):
        self.key = key
        self.base = base
        self.last = 0.0
        self.failures = 0
        self.dead = False
        self.requests = 0
        (CACHE / key).mkdir(parents=True, exist_ok=True)

    def cache_path(self, path: str) -> Path:
        name = re.sub(r"[^A-Za-z0-9._-]", "_", path.strip("/")) or "index"
        if len(name) > 80:
            name = name[:60] + "-" + hashlib.sha1(path.encode()).hexdigest()[:10]
        return CACHE / self.key / name

    def get(self, path: str) -> tuple[str | None, str]:
        """(text, status). status: cache, ok, 404, error. The text is None unless cache or ok."""
        cached = self.cache_path(path)
        gone = cached.with_name(cached.name + ".404")
        if cached.exists():
            return cached.read_text(encoding="utf-8", errors="replace"), "cache"
        if gone.exists():
            return None, "404"
        if self.dead:
            return None, "error"
        for attempt in range(3):
            wait = self.last + DELAY - time.monotonic()
            if wait > 0:
                time.sleep(wait)
            self.last = time.monotonic()
            self.requests += 1
            try:
                req = urllib.request.Request(self.base + path, headers={"User-Agent": USER_AGENT, "Accept": "text/html"})
                with urllib.request.urlopen(req, timeout=90) as r:
                    body = r.read().decode("utf-8", errors="replace")
                cached.write_text(body, encoding="utf-8")
                self.failures = 0
                return body, "ok"
            except urllib.error.HTTPError as e:
                if e.code == 404:
                    gone.write_text("", encoding="utf-8")
                    return None, "404"
                if e.code in (403, 429):
                    self.failures += 1
                    print(f"[{self.key}] HTTP {e.code} on {path} (failure {self.failures})", flush=True)
                    if self.failures >= 3:
                        self.dead = True
                        print(f"[{self.key}] too many refusals: stopping requests to this site", flush=True)
                        return None, "error"
                    time.sleep(60)
                else:
                    time.sleep(10)
            except (urllib.error.URLError, TimeoutError, OSError):
                time.sleep(10)
        return None, "error"


def plain(page: str) -> str:
    """The visible text of a page: tags out, entities decoded, spaces collapsed."""
    text = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", page)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", html.unescape(text).replace("\xa0", " ")).strip()


def compact(x: str) -> str:
    """'30.0000' -> '30', '0.300' -> '0.3': the same plain decimals as U-001."""
    return format(Decimal(x).normalize(), "f")


# ----------------------------------------------------------------------------------- indexes

def tgsc_index(site: Site) -> dict[str, list[tuple[str, str]]]:
    """CAS -> [(page path, name)] from TGSC's static CAS indexes."""
    found: dict[str, list[tuple[str, str]]] = {}
    for path in TGSC_INDEXES:
        page, status = site.get(path)
        if page is None:
            print(f"[tgsc] index {path}: {status}", flush=True)
            continue
        for cas, cell in TGSC_ROW.findall(page):
            for link, name in TGSC_LINK.findall(cell):
                entry = (link, html.unescape(name).strip())
                if entry not in found.setdefault(cas, []):
                    found[cas].append(entry)
    print(f"[tgsc] {len(found)} CAS in the indexes", flush=True)
    return found


def pw_index(site: Site) -> dict[str, list[tuple[str, str]]]:
    """CAS -> [(pro_id, name)] from the PerfumersWorld catalogue page."""
    page, status = site.get(PW_CATALOG)
    found: dict[str, list[tuple[str, str]]] = {}
    if page is None:
        print(f"[pw] catalogue: {status}", flush=True)
        return found
    cards = list(PW_CARD.finditer(page))
    for i, m in enumerate(cards):
        end = cards[i + 1].start() if i + 1 < len(cards) else len(page)
        block = page[m.end():end]
        c = re.search(r'data-cas-no="([^"]*)"', block[:3000])
        if not c:
            continue
        for cas in CAS_RE.findall(c.group(1)):
            entry = (m.group(1), html.unescape(m.group(2)).strip())
            if entry not in found.setdefault(cas, []):
                found[cas].append(entry)
    print(f"[pw] {len(cards)} products, {len(found)} CAS", flush=True)
    return found


# ----------------------------------------------------------------------------------- pages

def read_tgsc(page: str) -> dict:
    text = plain(page)
    figs = {(m.group(0), m.group(2)) for m in TGSC_FIG.finditer(text)}
    values = {v for _, v in figs}
    return {"cas": set(CAS_RE.findall(text)),
            "fig": sorted(figs)[0] if len(values) == 1 else None,
            "conflict": len(values) > 1}


def read_pw(page: str) -> dict:
    text = plain(page)
    spec = re.search(r'CAS No\.</span><span class="pw-spec-value">([^<]*)</span>', page)
    m = PW_FIG.search(text)
    return {"cas": set(CAS_RE.findall(spec.group(1))) if spec else set(),
            "fig": (m.group(0), m.group(1), m.group(2), m.group(3)) if m else None}


def fetch_pages(site: Site, paths: list[str], reader, results: dict, label: str) -> None:
    started = time.monotonic()
    for i, path in enumerate(paths, 1):
        if path in results:
            continue
        page, status = site.get(path)
        results[path] = {"status": status, **(reader(page) if page else {})}
        if i % 50 == 0 or i == len(paths):
            print(f"[{label}] {i}/{len(paths)} pages, {site.requests} requests, "
                  f"{(time.monotonic() - started) / 60:.1f} min", flush=True)


def consulted(site: Site, path: str) -> str:
    p = site.cache_path(path)
    return datetime.fromtimestamp(p.stat().st_mtime).date().isoformat() if p.exists() else date.today().isoformat()


# ----------------------------------------------------------------------------------- materials

def sort_key(material_id: str):
    prefix, _, number = material_id.partition(":")
    return prefix, int(number) if number.isdigit() else 0, material_id


def select_materials(phase: str) -> list[dict]:
    with MATERIALS.open(encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))
    with PILOT.open(encoding="utf-8", newline="") as f:
        pilot = {r["material_id"] for r in csv.DictReader(f)}
    shared: dict[str, int] = {}
    for r in rows:
        if r["cas"]:
            shared[r["cas"]] = shared.get(r["cas"], 0) + 1
    chosen = []
    for r in rows:
        if r["id"] in pilot or not r["cas"] or not CAS_RE.fullmatch(r["cas"]):
            continue
        if r["nombres_proveedores"]:
            r["fase"] = "1"
        elif r["clase"] == "molécula":
            r["fase"] = "2"
        else:
            continue
        if phase != "todas" and r["fase"] != phase:
            continue
        r["comparten"] = shared[r["cas"]]
        chosen.append(r)
    return sorted(chosen, key=lambda r: (r["fase"], sort_key(r["id"])))


# ----------------------------------------------------------------------------------- rows

def verdict(material: dict, pages: list[tuple[str, str]], info: dict, source: str) -> tuple[str, list[dict]]:
    """(state, candidate rows) for one material in one source.

    Each candidate is {"path", "name", "fig", "auditoria", "note"}; state sums the search up.
    """
    if not pages:
        return "sin-pagina", []
    natural = material["clase"] == "natural"
    usable = []  # pages that are of this CAS
    for path, name in pages:
        r = info.get(path, {})
        if r.get("status") in ("cache", "ok") and material["cas"] in r.get("cas", set()):
            usable.append((path, name, r))
    if not usable:
        states = {info.get(p, {}).get("status") for p, _ in pages}
        return ("error" if "error" in states else "cas-no-coincide"), []
    with_fig = [(p, n, r) for p, n, r in usable if r.get("fig")]
    if not with_fig:
        return ("conflicto" if any(r.get("conflict") for _, _, r in usable) else "sin-cifra"), []
    if natural and (len(pages) > 1 or material["comparten"] > 1):
        why = (f"el CAS tiene {len(pages)} paginas en la fuente" if len(pages) > 1
               else f"el CAS lo comparten {material['comparten']} materiales del glosario (formas de un natural)")
        return "ambigua", [{"path": p, "name": n, "fig": r["fig"], "auditoria": "forma ambigua",
                            "note": f"Natural: {why}; no se usa."} for p, n, r in with_fig]
    figures = {r["fig"][1:] if source == "pw" else r["fig"][1] for _, _, r in with_fig}
    if len(figures) > 1:
        return "ambigua", [{"path": p, "name": n, "fig": r["fig"], "auditoria": "forma ambigua",
                            "note": f"Varias paginas del CAS con cifras distintas ({len(pages)}); no se usa."}
                           for p, n, r in with_fig]
    path, name, r = with_fig[0]
    others = [p for p, _, _ in usable if p != path]
    note = f"Pagina de {name}."
    if others:
        note += f" Otras {len(others)} paginas del mismo CAS dan la misma cifra."
    if len(usable) > len(with_fig):
        note += f" {len(usable) - len(with_fig)} pagina(s) del CAS sin cifra."
    if material["comparten"] > 1:
        note += f" El CAS lo comparten {material['comparten']} materiales del glosario."
    return "con-cifra", [{"path": path, "name": name, "fig": r["fig"], "auditoria": "aceptada", "note": note}]


def make_row(material: dict, source: str, site: Site, cand: dict) -> dict:
    row = {"material_id": material["id"], "cas": material["cas"], "nombre": material["nombre"], "base": "concentrado"}
    if source == "tgsc":
        quote, value = cand["fig"]
        url = TGSC + cand["path"]
        row.update(fuente="The Good Scents Company (TGSC)", tipo_fuente="base-de-datos", url=url,
                   cita=quote, min_pct="", max_pct=compact(value), papel="techo")
    else:
        quote, low, mid, high = cand["fig"]
        url = f"{PW}/view.php?pro_id={cand['path']}"
        row.update(fuente="PerfumersWorld", tipo_fuente="proveedor", url=url, cita=quote,
                   min_pct=compact(low), max_pct=compact(high), papel="habitual y techo")
        nums = [Decimal(low), Decimal(mid), Decimal(high)]
        if not all(n > 0 for n in nums) or not nums[0] <= nums[1] <= nums[2]:
            # An unknown never counts as zero: a 0.000 or a swapped order is not a whole reading.
            row["auditoria"] = "cifra incompleta"
            cand = {**cand, "note": cand["note"] + " Minimo, medio o maximo a cero o fuera de orden."}
    row.setdefault("auditoria", cand["auditoria"])
    row["consultado"] = consulted(site, cand["path"] if source == "tgsc" else f"/view.php?pro_id={cand['path']}")
    row["notas"] = cand["note"]
    return row


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--fase", default="todas", choices=["1", "2", "todas"])
    args = ap.parse_args()
    started = time.monotonic()
    tgsc, pw = Site("tgsc", TGSC), Site("pw", PW)

    materials = select_materials(args.fase)
    print(f"{len(materials)} materiales (fase {args.fase})", flush=True)

    # The two sites are polite on their own clock, so each gets its thread.
    indexes: dict[str, dict] = {}
    t1 = threading.Thread(target=lambda: indexes.__setitem__("tgsc", tgsc_index(tgsc)))
    t2 = threading.Thread(target=lambda: indexes.__setitem__("pw", pw_index(pw)))
    t1.start(), t2.start(), t1.join(), t2.join()

    def order(source: str) -> list[str]:
        seen, out = set(), []
        for m in materials:
            for path, _ in indexes[source].get(m["cas"], []):
                if path not in seen:
                    seen.add(path)
                    out.append(path)
        return out

    tgsc_paths, pw_paths = order("tgsc"), order("pw")
    print(f"paginas por pedir: TGSC {len(tgsc_paths)}, PW {len(pw_paths)}", flush=True)
    info_tgsc: dict = {}
    info_pw: dict = {}
    pw_ids = [f"/view.php?pro_id={p}" for p in pw_paths]
    t1 = threading.Thread(target=fetch_pages, args=(tgsc, tgsc_paths, read_tgsc, info_tgsc, "tgsc"))
    t2 = threading.Thread(target=fetch_pages, args=(pw, pw_ids, read_pw, info_pw, "pw"))
    t1.start(), t2.start(), t1.join(), t2.join()
    info_pw = {path.split("=", 1)[1]: v for path, v in info_pw.items()}

    rows, searches = [], []
    for m in materials:
        ts, tc = verdict(m, indexes["tgsc"].get(m["cas"], []), info_tgsc, "tgsc")
        ps, pc = verdict(m, indexes["pw"].get(m["cas"], []), info_pw, "pw")
        rows += [make_row(m, "tgsc", tgsc, c) for c in tc] + [make_row(m, "pw", pw, c) for c in pc]
        searches.append({"material_id": m["id"], "cas": m["cas"], "clase": m["clase"], "fase": m["fase"],
                         "tgsc_paginas": len(indexes["tgsc"].get(m["cas"], [])), "tgsc_estado": ts,
                         "pw_paginas": len(indexes["pw"].get(m["cas"], [])), "pw_estado": ps})
    for path, header, data in ((OUT, HEADER, rows), (SEARCH_OUT, SEARCH_HEADER, searches)):
        with path.open("w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=header, lineterminator="\n")
            w.writeheader()
            w.writerows(data)
    accepted = {r["material_id"] for r in rows if r["auditoria"] == "aceptada"}
    print(f"{len(materials)} buscados; {len(rows)} filas; {len(accepted)} materiales con alguna fila aceptada; "
          f"{(time.monotonic() - started) / 60:.1f} min; peticiones TGSC {tgsc.requests}, PW {pw.requests}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
