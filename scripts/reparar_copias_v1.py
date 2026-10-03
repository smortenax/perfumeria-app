# -*- coding: utf-8 -*-
"""Repara las copias de `Fórmulas\\copias-v1` que quedaron al revés (app 0.2.0).

Al migrar una fórmula de la v1 a la v2, la app copia el original tal cual a `copias-v1` y guarda la fórmula editada en su ruta de
siempre. Si alguna vez quedó al revés (la editada en `copias-v1` y el original v1 en `Fórmulas`), este script lo detecta y las
intercambia.

Para cada archivo de `copias-v1` lo compara con el de su mismo nombre en `Fórmulas`:

* **iguales**: no se toca;
* **distintos y en su sitio**: la copia es la v1 (no tiene materiales `v2:` o tiene menos que la fórmula editada). Es lo normal: una
  copia y su fórmula migrada *siempre* son distintas;
* **distintos y al revés**: la copia tiene MÁS materiales `v2:` que el archivo de `Fórmulas` (la copia es la editada). Estos son los
  que se intercambian;
* **sin pareja**: la copia no tiene archivo en `Fórmulas`.

Sin `--aplicar` solo enseña la lista y NO toca nada. Con `--aplicar` intercambia únicamente los «al revés», por un nombre temporal,
y no pisa nada. Uso:

    python scripts/reparar_copias_v1.py [carpeta Fórmulas]            (solo la lista)
    python scripts/reparar_copias_v1.py [carpeta Fórmulas] --aplicar  (después de aprobarla)
"""
import json
import os
import sys
from pathlib import Path


def v2_materials(path: Path) -> int | None:
    try:
        data = json.loads(path.read_text(encoding="utf-8-sig"))
        return sum(1 for key in data.get("materials", {}) if key.startswith("v2:"))
    except (OSError, ValueError):
        return None


def classify(copy: Path, library: Path) -> tuple[str, str]:
    if not library.exists():
        return "sin pareja", "no hay archivo con ese nombre en Fórmulas"
    a, b = copy.read_bytes(), library.read_bytes()
    if a == b:
        return "iguales", "la copia y el archivo son el mismo"
    in_copy, in_library = v2_materials(copy), v2_materials(library)
    if in_copy is None or in_library is None:
        return "ilegible", "uno de los dos no se puede leer como fórmula"
    detail = f"materiales v2: copia {in_copy}, Fórmulas {in_library}"
    if in_copy > in_library:
        return "al revés", detail + " (la copia es la editada)"
    return "en su sitio", detail + " (la copia es la v1)"


def main(argv: list[str]) -> int:
    apply = "--aplicar" in argv
    args = [a for a in argv if not a.startswith("--")]
    default = Path(os.path.expandvars(r"%USERPROFILE%")) / "Documents" / "Perfumería" / "Fórmulas"
    folder = Path(args[0]) if args else default
    backups = folder / "copias-v1"
    if not backups.is_dir():
        print(f"No hay carpeta {backups}: nada que reparar.")
        return 0
    rows = [(f, *classify(f, folder / f.name)) for f in sorted(backups.glob("*.json"))]
    if not rows:
        print("copias-v1 está vacía: nada que reparar.")
        return 0
    print(f"{len(rows)} archivos en {backups}:\n")
    for copy, kind, detail in rows:
        print(f"  [{kind:11}] {copy.name}  ·  {detail}")
    swap = [(copy, folder / copy.name) for copy, kind, _ in rows if kind == "al revés"]
    print(f"\nA intercambiar: {len(swap)}.")
    if not swap:
        return 0
    if not apply:
        print("No se ha tocado nada. Si apruebas la lista, repite con --aplicar.")
        return 0
    for copy, library in swap:
        temp = library.with_name(library.name + ".intercambio")
        library.rename(temp)
        copy.rename(library)
        temp.rename(copy)
        print(f"  intercambiado: {copy.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
