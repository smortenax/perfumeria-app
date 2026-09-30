#!/usr/bin/env python3
"""C-002 step 1: extract text from every Perfumiarz PDF with pdftotext (-layout).

Usage: c002_extraer_texto.py OUT_DIR   (one OUT_DIR/<pdf>.txt per PDF; empty file = no text)
"""
import os, sys, subprocess
from concurrent.futures import ThreadPoolExecutor

DOCS = r"C:\Users\SERGI\Claude\Projects\perfumeria-app\datos\glosario\.cache\proveedores\perfumiarz\documentos"


def run(name, out):
    dst = os.path.join(out, name + ".txt")
    if os.path.exists(dst):
        return
    r = subprocess.run(["pdftotext", "-layout", "-enc", "UTF-8", os.path.join(DOCS, name), dst], capture_output=True)
    if r.returncode != 0:
        open(dst, "w").close()


if __name__ == "__main__":
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    names = sorted(os.listdir(DOCS))
    with ThreadPoolExecutor(8) as ex:
        list(ex.map(lambda n: run(n, out), names))
    print(len(names), "processed")
