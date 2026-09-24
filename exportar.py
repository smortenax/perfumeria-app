#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Exporta al proyecto de la app: la carpeta app/ entera y los datos que usa.

`app/` no copia datos dentro del repositorio —cada dato vive una sola vez—; la copia se
hace aquí, en el momento de exportar.

Uso:  python app/exportar.py RUTA_DEL_PROYECTO_DE_LA_APP
"""
import shutil
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
DATOS = [
    "conocimiento/normativa/ifra-cat4.csv",
    "materias-primas/_datos/niveles-de-uso.csv",
    "materias-primas/_datos/limites-de-uso.csv",
    "vistas/inventario.csv",
    "conocimiento/fig/glosario-fig.csv",
]


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    destino = Path(sys.argv[1]).resolve()
    if destino == RAIZ or RAIZ in destino.parents:
        raise SystemExit("El destino no puede estar dentro de este repositorio.")
    (destino / "datos").mkdir(parents=True, exist_ok=True)
    for f in (RAIZ / "app").iterdir():
        if f.is_file() and f.name != "exportar.py":
            shutil.copy2(f, destino / f.name)
    for rel in DATOS:
        shutil.copy2(RAIZ / rel, destino / "datos" / Path(rel).name)
        print("datos/%s" % Path(rel).name)
    print("-> %s" % destino)


if __name__ == "__main__":
    main()
