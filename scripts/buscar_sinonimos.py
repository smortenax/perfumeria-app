#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Trae de PubChem los sinónimos de cada molécula del glosario, por su CAS (P38).

Es la materia prima de la capa de nombres comerciales: entre los sinónimos de PubChem
están los nombres de uso («Hedione», «Galaxolide») y algunas siglas («HHCB»). Guarda la
respuesta tal cual en `datos/glosario/.cache/pubchem.json`, fuera de Git, y se puede
cortar y retomar: lo ya traído no se vuelve a pedir.

PubChem pide no pasar de 5 peticiones por segundo; aquí van unas 3.
Uso:  python scripts/buscar_sinonimos.py
"""
import csv
import json
import sys
import subprocess
import time
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "datos" / "glosario" / ".cache" / "pubchem.json"
URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{}/synonyms/JSON"
AGENT = "perfumeria-app/0.1 (formulation tool; synonyms by CAS)"


def fetch(cas: str) -> dict:
    """{"cid": [...], "sinonimos": [...]} or {"error": "..."}; a 404 is an empty answer.
    Through curl: PubChem answers urllib's requests with «server busy», and curl's not."""
    wait = 2.0
    last = ""
    for _ in range(5):
        done = subprocess.run(["curl", "-s", "-m", "30", "-A", AGENT, "-w", "\n%{http_code}",
                               URL.format(urllib.parse.quote(cas))], capture_output=True, text=True,
                              encoding="utf-8", errors="replace")
        body, _, code = done.stdout.rpartition("\n")
        if code == "200":
            infos = json.loads(body)["InformationList"]["Information"]
            return {"cid": [i["CID"] for i in infos], "sinonimos": [s for i in infos for s in i.get("Synonym", [])]}
        if code == "404":
            return {"cid": [], "sinonimos": []}
        last = f"HTTP {code or 'sin respuesta'}"
        time.sleep(wait)
        wait *= 2
    return {"error": last}


def main() -> None:
    rows = list(csv.DictReader((ROOT / "datos" / "glosario" / "materiales.csv").open(encoding="utf-8")))
    wanted = sorted({r["cas"] for r in rows if r["clase"] == "molécula" and r["cas"]})
    cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
    todo = [c for c in wanted if c not in cache or "error" in cache[c]]
    print(f"{len(wanted)} CAS de moléculas; faltan {len(todo)}", flush=True)
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    for i, cas in enumerate(todo, 1):
        cache[cas] = fetch(cas)
        time.sleep(0.34)
        if i % 50 == 0 or i == len(todo):
            CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
            errors = sum(1 for v in cache.values() if "error" in v)
            print(f"{i}/{len(todo)} · errores {errors}", flush=True)
    sys.exit(0)


if __name__ == "__main__":
    main()
