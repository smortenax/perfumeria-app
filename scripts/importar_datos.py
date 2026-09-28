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
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "datos" / "fuente"
LAB_URL = "https://github.com/smortenax/perfumeria-lab"

# Data files taken from the lab, by their path inside the lab repository. IFRA comes from
# IFRA's own files (scripts/importar_ifra.py), the glossary from the FIG with the user's
# codes (scripts/generar_glosario.py), and the lab's materials stay out of the app (P37).
# What comes from here is the own layer of the materials (plan, D4), from free-use sources
# only (P35): OPERA's vapour pressure, from the EPA's CompTox, public domain and MIT (P42).
SOURCES: list[str] = [
    "fuentes/investigaciones/2026-09-26-frente-6-piezas/pieza-8-presion-de-vapor-opera.csv",
    # The families with their colour, a categorisation of its own over the FIG (P48).
    "fuentes/investigaciones/2026-09-26-frente-6-piezas/pieza-11-paleta.csv",
    "fuentes/investigaciones/2026-09-26-frente-6-piezas/pieza-11-familias-y-color.csv",
    # The duration and position: of the molecules from OPERA, of the naturals from Poucher (P48).
    "fuentes/investigaciones/2026-09-26-frente-6-piezas/pieza-12-duracion-estimada.csv",
    "fuentes/investigaciones/2026-09-26-frente-6-piezas/pieza-12-curva-duracion.csv",
    "fuentes/investigaciones/2026-09-26-frente-6-piezas/pieza-13-duracion-naturales.csv",
]

# Documents that explain what is imported: lab path -> name in datos/fuente/. The FIG's
# stay, for its terms of use and the definitions of its descriptors.
DOCS = {
    "conocimiento/lenguaje/fig/README.md": "leeme-glosario-fig.md",
    "conocimiento/lenguaje/fig/descriptores.md": "fig-descriptores.md",
    "fuentes/investigaciones/2026-09-26-frente-6-piezas/pieza-8-presion-de-vapor-estimada.md": "leeme-presion-de-vapor.md",
    "fuentes/investigaciones/2026-09-28-frente-6-color-y-duracion-para-app.md": "leeme-color-y-duracion.md",
    "fuentes/investigaciones/2026-09-28-frente-6-duracion-naturales.md": "leeme-duracion-naturales.md",
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
        # LF, as the repository keeps it (.gitattributes), so the hash matches a checkout.
        dst.write_bytes((lab / rel).read_bytes().replace(b"\r\n", b"\n"))
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
