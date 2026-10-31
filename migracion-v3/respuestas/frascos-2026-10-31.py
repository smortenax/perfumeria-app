"""The bottles the user made on 2026-10-31, from their sheet (diluciones-31-oct.xlsx, filled in the
project thread that day): what fell of the material and of the diluent, in grams, as typed. Only the
typed cells are read, never the formulas; a row without both weights is not a bottle.
Writes frascos-2026-10-31.csv next to it; the same sheet gives the same bytes.

    python -I migracion-v3/respuestas/frascos-2026-10-31.py
"""
import csv
import hashlib
from pathlib import Path

from openpyxl import load_workbook

HERE = Path(__file__).parent
SHEET = HERE / "diluciones-31-oct.xlsx"
OUT = HERE / "frascos-2026-10-31.csv"
FIRST, LAST = 8, 16  # the bottles; below them, the sheet's example and the totals

ws = load_workbook(SHEET).active
digest = hashlib.sha256(SHEET.read_bytes()).hexdigest()
rows = []
for r in range(FIRST, LAST + 1):
    name, bottle, diluent, comes_at, target = (ws.cell(r, c).value for c in (1, 2, 3, 4, 5))
    product, real_diluent = ws.cell(r, 8).value, ws.cell(r, 10).value
    if not isinstance(product, (int, float)) or not isinstance(real_diluent, (int, float)):
        raise SystemExit(f"Fila {r} ({name}): sin los dos pesos")
    rows.append({
        "fila": r,
        "material": name,
        "frasco": bottle,
        "diluyente": diluent,
        "viene_al": f"{comes_at:g}",
        "objetivo": f"{target:g}",
        "producto_g": f"{product:.3f}",
        "diluyente_g": f"{real_diluent:.3f}",
        "nota": ws.cell(r, 14).value or "",
    })
with OUT.open("w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0]), lineterminator="\n")
    w.writeheader()
    w.writerows(rows)
print(f"{len(rows)} frascos de {SHEET.name} (sha256 {digest[:12]}) -> {OUT.name}")
