#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Importa los datos de referencia del laboratorio a datos/fuente/.

La app funciona sola (docs/decisiones.md §0): al usarse no lee el laboratorio. Este script
copia los CSV de los que sale su paquete de datos, **y los documentos que explican qué
significa cada columna**, y apunta en `procedencia.json` de qué commit del laboratorio
vienen, para que nunca haya duda de qué versión lleva la app.

Los documentos se copian con sus enlaces relativos convertidos en URL del laboratorio,
fijadas a ese commit, y con una cabecera que dice de dónde salen.

Sustituye al antiguo `app/exportar.py` del laboratorio, que empujaba los datos hacia aquí.
Ahora es la app la que los trae.

Antes de importar, en el laboratorio: regenerar las vistas (el inventario sale de las
fichas) y hacer commit, para que la procedencia apunte a un estado real.

Uso:  python scripts/importar_datos.py [RUTA_DEL_LABORATORIO]
      (por defecto, la carpeta hermana ../Perfumery)
"""
import hashlib
import json
import posixpath
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "datos" / "fuente"
LAB_URL = "https://github.com/smortenax/perfumeria-lab"

# Data files taken from the lab, by their path inside the lab repository.
SOURCES = [
    "conocimiento/normativa/ifra-cat4.csv",
    "materias-primas/_datos/niveles-de-uso.csv",
    "materias-primas/_datos/limites-de-uso.csv",
    "vistas/inventario.csv",
    "conocimiento/lenguaje/fig/glosario-fig.csv",
]

# Documents that explain those files: lab path -> name in datos/fuente/.
DOCS = {
    "conocimiento/normativa/README.md": "leeme-ifra-cat4.md",
    "materias-primas/_datos/niveles-de-uso.md": "leeme-niveles-de-uso.md",
    "conocimiento/lenguaje/fig/README.md": "leeme-glosario-fig.md",
    "conocimiento/lenguaje/fig/descriptores.md": "fig-descriptores.md",
}

LINK = re.compile(r"(!?)\[([^\]]*)\]\(([^)\s]+)\)")


def git(lab: Path, *args: str) -> str:
    return subprocess.run(["git", "-C", str(lab), *args], capture_output=True,
                          text=True, check=True).stdout.strip()


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def copy_doc(lab: Path, rel: str, dst: Path, commit: str) -> None:
    """Copy a lab Markdown document, pinning its relative links to the lab commit."""
    text = (lab / rel).read_text(encoding="utf-8")
    base = posixpath.dirname(rel)

    def to_url(m: re.Match) -> str:
        bang, label, target = m.group(1), m.group(2), m.group(3)
        if re.match(r"^(https?:|mailto:|#)", target):
            return m.group(0)
        path, _, frag = target.partition("#")
        resolved = posixpath.normpath(posixpath.join(base, path))
        kind = "tree" if (lab / resolved).is_dir() else "blob"
        url = f"{LAB_URL}/{kind}/{commit}/{resolved}" + (f"#{frag}" if frag else "")
        return f"{bang}[{label}]({url})"

    header = (f"> 📥 **Copiado del laboratorio** (`{rel}`, commit `{commit[:7]}`) por "
              f"`scripts/importar_datos.py`. **No se edita aquí**: se corrige en el "
              f"laboratorio y se vuelve a importar.\n\n")
    dst.write_text(header + LINK.sub(to_url, text), encoding="utf-8", newline="\n")


def main() -> None:
    lab = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / "Perfumery"
    lab = lab.resolve()
    if not (lab / ".git").exists():
        raise SystemExit(f"No es un repositorio git: {lab}")

    commit = git(lab, "rev-parse", "HEAD")
    commit_date = git(lab, "log", "-1", "--format=%cI")
    # Uncommitted changes in the sources mean the copy does not match the commit.
    dirty = git(lab, "status", "--porcelain", "--", *SOURCES, *DOCS)

    DEST.mkdir(parents=True, exist_ok=True)
    files = {}
    for rel in SOURCES:
        dst = DEST / Path(rel).name
        shutil.copy2(lab / rel, dst)
        files[dst.name] = {"origen": rel, "sha256": sha256(dst)}
        print(f"datos/fuente/{dst.name}")

    docs = {}
    for rel, name in DOCS.items():
        dst = DEST / name
        copy_doc(lab, rel, dst, commit)
        docs[name] = {"origen": rel}
        print(f"datos/fuente/{name}")

    provenance = {
        "laboratorio": LAB_URL,
        "commit": commit,
        "fecha_commit": commit_date,
        "cambios_sin_commit": bool(dirty),
        "importado": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "archivos": files,
        "documentos": docs,
    }
    (DEST / "procedencia.json").write_text(
        json.dumps(provenance, ensure_ascii=False, indent=2) + "\n", encoding="utf-8",
        newline="\n")
    print(f"procedencia: {commit[:7]}" + (" (con cambios sin commit)" if dirty else ""))


if __name__ == "__main__":
    main()
