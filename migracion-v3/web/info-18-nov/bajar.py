"""Línea de información de las altas del 18-nov (tanda 60): baja los documentos que enlaza cada página de
Perfumiarz (fichas.csv del pedido: SDS, IFRA, alérgenos UE, CoA) a una caché local que no entra en Git
(los documentos de origen no pasan a la v3, V3-21), y su texto con `pdftotext -layout`, para que
extraer.py lea las cifras. Un segundo paso no vuelve a pedirlos.

    python3 -I migracion-v3/web/info-18-nov/bajar.py <carpeta-caché>
"""
import csv, os, subprocess, sys, time, urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
FICHAS = HERE.parent / "perfumiarz-pedido-18-nov" / "fichas.csv"
CACHE = Path(sys.argv[1])
CACHE.mkdir(parents=True, exist_ok=True)
n_ok = 0
for r in csv.DictReader(open(FICHAS, encoding="utf-8")):
    for kind in ("sds", "ifra", "coa", "eu_allergens"):
        url = r[kind].strip()
        if not url:
            continue
        pdf = CACHE / f"{r['n']}-{kind}.pdf"
        if not pdf.exists():
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (research script)"})
            with urllib.request.urlopen(req, timeout=60) as resp:
                pdf.write_bytes(resp.read())
            time.sleep(0.5)
        txt = pdf.with_suffix(".txt")
        if not txt.exists():
            subprocess.run(["pdftotext", "-layout", str(pdf), str(txt)], check=False)
        n_ok += 1
print(f"{n_ok} documentos en {CACHE}")
