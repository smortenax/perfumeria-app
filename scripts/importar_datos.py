#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Importa los datos de referencia del laboratorio a datos/fuente/.

La app funciona sola (docs/decisiones.md §0): al usarse no lee el laboratorio. Este script
copia los CSV de los que sale su paquete de datos y apunta en `procedencia.json` de qué
commit del laboratorio vienen, para que nunca haya duda de qué versión lleva la app.

Sustituye al antiguo `app/exportar.py` del laboratorio, que empujaba los datos hacia aquí.
Ahora es la app la que los trae.

Antes de importar, en el laboratorio: regenerar las vistas (el inventario sale de las
fichas) y hacer commit, para que la procedencia apunte a un estado real.

Uso:  python scripts/importar_datos.py [RUTA_DEL_LABORATORIO]
      (por defecto, la carpeta hermana ../Perfumery)
"""
import hashlib
import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "datos" / "fuente"

# Files taken from the lab, by their path inside the lab repository.
SOURCES = [
    "conocimiento/normativa/ifra-cat4.csv",
    "materias-primas/_datos/niveles-de-uso.csv",
    "materias-primas/_datos/limites-de-uso.csv",
    "vistas/inventario.csv",
    "conocimiento/lenguaje/fig/glosario-fig.csv",
]


def git(lab: Path, *args: str) -> str:
    return subprocess.run(["git", "-C", str(lab), *args], capture_output=True,
                          text=True, check=True).stdout.strip()


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    lab = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / "Perfumery"
    lab = lab.resolve()
    if not (lab / ".git").exists():
        raise SystemExit(f"No es un repositorio git: {lab}")

    commit = git(lab, "rev-parse", "HEAD")
    commit_date = git(lab, "log", "-1", "--format=%cI")
    # Uncommitted changes in the source files mean the copy does not match the commit.
    dirty = git(lab, "status", "--porcelain", "--", *SOURCES)

    DEST.mkdir(parents=True, exist_ok=True)
    files = {}
    for rel in SOURCES:
        src = lab / rel
        dst = DEST / Path(rel).name
        shutil.copy2(src, dst)
        files[Path(rel).name] = {"origen": rel, "sha256": sha256(dst)}
        print(f"datos/fuente/{dst.name}")

    provenance = {
        "laboratorio": "https://github.com/smortenax/perfumeria-lab",
        "commit": commit,
        "fecha_commit": commit_date,
        "cambios_sin_commit": bool(dirty),
        "importado": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "archivos": files,
    }
    (DEST / "procedencia.json").write_text(
        json.dumps(provenance, ensure_ascii=False, indent=2) + "\n", encoding="utf-8",
        newline="\n")
    print(f"procedencia: {commit[:7]}" + (" (con cambios sin commit)" if dirty else ""))


if __name__ == "__main__":
    main()
