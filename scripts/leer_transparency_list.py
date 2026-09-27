#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Lee la IFRA Transparency List de la web de IFRA, página a página, a un CSV.

IFRA no da la lista como archivo: es una tabla en ifrafragrance.org/transparency-list,
de 24 ingredientes por página. El usuario pidió leerla así (2026-09-27). Este script pide
cada página con calma, un segundo y medio entre una y otra, y guarda las tres columnas
de la tabla: CAS, nombre principal y categoría de natural. Deja en `procedencia.json`
la fecha, las páginas y la huella del CSV.

IFRA no publica condiciones de reutilización de la lista. Antes de distribuir la app
como producto hay que revisar la licencia (plan, «Después»).

Uso:  python scripts/leer_transparency_list.py
"""
import csv
import hashlib
import html
import json
import re
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "datos" / "ifra" / "transparencia-2025"
URL = "https://ifrafragrance.org/transparency-list?page={}"
AGENT = "Mozilla/5.0 (perfumeria-app; private formulation tool)"


def fetch(page: int) -> str:
    wait = 3.0
    for _ in range(5):
        done = subprocess.run(["curl", "-s", "-m", "40", "-A", AGENT, "-w", "\n%{http_code}", URL.format(page)],
                              capture_output=True, text=True, encoding="utf-8", errors="replace")
        body, _, code = done.stdout.rpartition("\n")
        if code == "200":
            return body
        time.sleep(wait)
        wait *= 2
    raise SystemExit(f"La página {page} no respondió")


def cell(text: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", text))).strip()


def rows_of(page_html: str) -> tuple[list[list[str]], int]:
    total = int(re.search(r"Page \d+ of (\d+)", page_html).group(1))
    rows = []
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", page_html, flags=re.S):
        cells = [cell(td) for td in re.findall(r"<td[^>]*>(.*?)</td>", tr, flags=re.S)]
        if cells:
            rows.append((cells + ["", "", ""])[:3])
    return rows, total


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    first, total = rows_of(fetch(1))
    rows = list(first)
    print(f"1/{total}", flush=True)
    for page in range(2, total + 1):
        time.sleep(1.5)
        got, _ = rows_of(fetch(page))
        if not got:
            raise SystemExit(f"La página {page} no trae filas")
        rows += got
        if page % 10 == 0 or page == total:
            print(f"{page}/{total} · {len(rows)} filas", flush=True)

    path = OUT / "transparency-list.csv"
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(["cas", "nombre_principal", "categoria_natural"])
        w.writerows(rows)
    provenance = {
        "fuente": "IFRA Transparency List, edición de 2025, leída de https://ifrafragrance.org/transparency-list página a página",
        "leido": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "paginas": total,
        "filas": len(rows),
        "cas_distintos": len({r[0] for r in rows if r[0]}),
        "naturales": sum(1 for r in rows if r[2]),
        "sha256_csv": hashlib.sha256(path.read_bytes()).hexdigest(),
        "aviso": "IFRA no publica condiciones de reutilización de la lista: revisar la licencia antes de distribuir la app.",
    }
    (OUT / "procedencia.json").write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + "\n",
                                          encoding="utf-8", newline="\n")
    print(json.dumps(provenance, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
