#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Los constituyentes regulados que declaran los proveedores, ya auditados, por material.

Lee los lotes del frente C de `docs/investigacion/2026-09-30-usos-y-constituyentes/lotes/` y
escribe `datos/glosario/origen/constituyentes-proveedores.csv`, que lee
`scripts/generar_glosario.py`.

La regla:
- **Solo entran las filas auditadas con cifra:** `auditoria` que empieza por «aceptada» o
  «corregida», con `material_id`, `estandar_ifra` y `max_pct`. Las bandas de clasificación
  (C-002), las fuentes aisladas y las excluidas no entran.
- **La cifra es `max_pct`:** el máximo de un rango, el «≤» de un máximo o el valor típico.
- **Dentro de una fuente se suma** lo que va a un mismo estándar: dos isómeros que cuentan
  juntos. **Entre fuentes cuenta la más alta**, que es lo prudente para IFRA.
- **El anexo de IFRA manda:** `generar_glosario.py` solo usa estas filas donde el anexo no da ese
  estándar para ese material (P37).
Uso:  python scripts/constituyentes_proveedores.py
"""
import csv
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOTS = ROOT / "docs" / "investigacion" / "2026-09-30-usos-y-constituyentes" / "lotes"
OUT = ROOT / "datos" / "glosario" / "origen" / "constituyentes-proveedores.csv"
BATCHES = ["C-001.csv", "C-003.csv"]


def counts(row: dict) -> bool:
    audit = row.get("auditoria", "")
    return (audit.startswith("aceptada") or audit.startswith("corregida")) and bool(
        row["material_id"] and row["estandar_ifra"] and row["max_pct"])


def main() -> None:
    # (material, standard) -> source -> summed fraction, with the names and CAS seen.
    found: dict[tuple[str, str], dict[str, Fraction]] = {}
    names: dict[tuple[str, str], set[str]] = {}
    kinds: dict[tuple[str, str, str], set[str]] = {}
    for batch in BATCHES:
        for row in csv.DictReader((LOTS / batch).open(encoding="utf-8")):
            if not counts(row):
                continue
            key = (row["material_id"], row["estandar_ifra"])
            source = f"{batch[:-4]}: {row['fuente']}"
            found.setdefault(key, {})
            found[key][source] = found[key].get(source, Fraction(0)) + Fraction(row["max_pct"])
            names.setdefault(key, set()).add(f"{row['constituyente']} ({row['cas_constituyente']})")
            kinds.setdefault((*key, source), set()).add(row["tipo_valor"])
    rows = []
    for (material, standard), by_source in sorted(found.items()):
        source, value = max(by_source.items(), key=lambda kv: kv[1])
        rows.append({
            "material_id": material,
            "estandar": standard,
            "constituyente": " · ".join(sorted(names[(material, standard)])),
            "concentracion_pct": str(float(value)) if value.denominator != 1 else str(value.numerator),
            "tipo_valor": "/".join(sorted(kinds[(material, standard, source)])),
            "fuente": source,
            "n_fuentes": len(by_source),
        })
    with OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()), lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    print(f"{OUT.relative_to(ROOT).as_posix()}: {len(rows)} filas, {len({r['material_id'] for r in rows})} materiales")


if __name__ == "__main__":
    main()
