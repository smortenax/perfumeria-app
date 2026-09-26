#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Convierte los archivos de IFRA de una enmienda en tablas CSV (P37).

Todo lo de IFRA sale de IFRA: los originales, tal como el usuario los descargó de su
web, viven en `datos/ifra/<enmienda>/origen/`, y este script los pasa a CSV en
`datos/ifra/<enmienda>/`, con las 12 categorías y no solo la 4. Apunta en
`procedencia.json` la huella de cada original.

- `estandares.csv`: un estándar por fila, con el límite de cada categoría.
- `estandar-cas.csv`: qué CAS cubre cada estándar, con los sinónimos de cada CAS.
- `naturales.csv`: el anexo de contribuciones, cuánto trae cada natural de cada
  constituyente regulado.
- `bases-schiff.csv`: la otra hoja del anexo, el aldehído que lleva cada base de Schiff.

Una celda de categoría queda como un número (en %, con punto decimal) o como una de
estas palabras: `sin-restriccion`, `prohibido`, `ver-nota`. Vacía si IFRA no da nada.

Solo usa la biblioteca estándar. Uso:  python scripts/importar_ifra.py [ENMIENDA]
"""
import csv
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OVERVIEW = "ifra-{n}st-amendment-ifra-standards-overview.xlsx"
ANNEX = "ifra-{n}st-amendment-annex-on-contributions-from-other-sources.xlsx"
INDEX = "ifra-{n}st-amendment-index-of-ifra-standards.pdf"

CAS_RE = re.compile(r"\b\d{2,7}-\d{2}-\d\b")
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}

# The 18 category columns of the overview, and their short names here.
CATEGORIES = ["1", "2", "3", "4", "5A", "5B", "5C", "5D", "6", "7A", "7B", "8", "9",
              "10A", "10B", "11A", "11B", "12"]


def read_xlsx(path: Path) -> dict[str, list[list[str]]]:
    """Every sheet as a list of rows of strings, with the cells in their columns."""
    z = zipfile.ZipFile(path)
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS):
            shared.append("".join(t.text or "" for t in si.iter(f"{{{NS['m']}}}t")))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    target = {r.get("Id"): r.get("Target").lstrip("/") for r in rels}
    sheets = {}
    for sheet in ET.fromstring(z.read("xl/workbook.xml")).find("m:sheets", NS):
        part = target[sheet.get(f"{{{NS['r']}}}id")]
        part = part if part.startswith("xl/") else "xl/" + part
        rows = []
        for row in ET.fromstring(z.read(part)).iter(f"{{{NS['m']}}}row"):
            cells = {}
            for c in row.findall("m:c", NS):
                letters = re.match(r"[A-Z]+", c.get("r")).group(0)
                col = 0
                for ch in letters:
                    col = col * 26 + ord(ch) - 64
                v = c.find("m:v", NS)
                if c.get("t") == "s" and v is not None:
                    value = shared[int(v.text)]
                elif c.get("t") == "inlineStr":
                    value = "".join(t.text or "" for t in c.iter(f"{{{NS['m']}}}t"))
                else:
                    value = v.text if v is not None else ""
                cells[col - 1] = value
            rows.append([cells.get(i, "") for i in range(max(cells) + 1)] if cells else [])
        sheets[sheet.get("name")] = rows
    return sheets


def number(text: str) -> str:
    """A percentage as IFRA wrote it, without the noise of binary floats: «0,10» and
    «1.6000000000000001E-4» become «0.1» and «0.00016»."""
    text = text.strip().replace(",", ".")
    value = Decimal(repr(float(text))) if re.search(r"[eE]", text) or len(text) > 12 else Decimal(text)
    return format(value.normalize(), "f")


def cell(text: str) -> tuple[str, str]:
    """A category cell: its value, and how it is expressed when it is not a plain %."""
    t = text.strip()
    if t == "":
        return "", ""
    if t.lower() == "no restriction":
        return "sin-restriccion", ""
    if t.lower().startswith("see notebox"):
        return "ver-nota", ""
    if t.startswith("0.0 (Prohibited)"):
        return "prohibido", ""
    m = re.fullmatch(r"([\d.,]+)\s*\((.+)\)", t)
    if m:
        return number(m.group(1)), m.group(2)
    if re.fullmatch(r"[\d.,Ee+-]+", t):
        return number(t), ""
    raise ValueError(f"Celda de categoría desconocida: {t!r}")


def lines(text: str) -> list[str]:
    return [line.strip() for line in text.replace("\r", "").split("\n") if line.strip()]


def cas_groups(text: str) -> list[tuple[str, str]]:
    """The CAS of a standard, each with the heading it sits under, if any
    (Tagetes: «Prohibition of Tagetes erecta:»)."""
    out, group = [], ""
    for line in lines(text):
        found = CAS_RE.findall(line)
        if found:
            out += [(c, group) for c in found]
        elif line.endswith(":"):
            group = line[:-1].strip()
    return out


def synonyms_by_cas(text: str) -> dict[str, list[str]]:
    """Synonyms come in blocks headed by «CAS:» when a standard has several CAS."""
    blocks: dict[str, list[str]] = {}
    current = None
    for line in lines(text):
        m = re.fullmatch(r"(\d{2,7}-\d{2}-\d)\s*:", line)
        if m:
            current = m.group(1)
            blocks[current] = []
        elif current:
            blocks[current].append(line)
    return blocks


NOTE_LIMIT = re.compile(r"does not exceed\s+(?:\d+\s*ppm\s*\()?\s*([\d.]+)")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write(path: Path, header: list[str], rows: list[dict]) -> None:
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=header, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    print(f"{path.relative_to(ROOT).as_posix()}: {len(rows)} filas")


def standards(overview: Path) -> tuple[list[dict], list[dict], str]:
    rows = read_xlsx(overview)["Sheet1"]
    disclaimer = rows[0][0]
    head = rows[1]
    col = {name: i for i, name in enumerate(head)}

    def get(r: list[str], name: str) -> str:
        i = col[name]
        return r[i].strip() if i < len(r) else ""

    std_rows, cas_rows = [], []
    for r in rows[2:]:
        if not r or not r[0].startswith("IFRA_STD"):
            continue
        key = r[0].strip()
        kind = get(r, "IFRA Standard type")
        row = {
            "estandar": key,
            "nombre": get(r, "Name of the IFRA Standard"),
            "tipo": kind,
            "prohibicion": "sí" if "PROHIBITION" in kind else "",
            "restriccion": "sí" if "RESTRICTION" in kind else "",
            "especificacion": "sí" if "SPECIFICATION" in kind else "",
            "enmienda": get(r, "Amendment number"),
            "publicaciones_anteriores": " ".join(lines(get(r, "Year of previous publication"))),
            "ultima_publicacion": get(r, "Year of last publication"),
            "plazo_creaciones_existentes": get(r, "Implementation deadline for existing creations"),
            "plazo_creaciones_nuevas": get(r, "Implementation deadline for new creations"),
            "propiedad": get(r, "Intrinsic property driving the risk management measure"),
            "alcance_cas": get(r, "CAS numbers (comment)"),
            "sinonimos": " | ".join(line for line in lines(get(r, "Synonyms"))
                                    if not re.fullmatch(r"\d{2,7}-\d{2}-\d\s*:", line)),
            "nota_prohibicion": " ".join(lines(get(r, "Prohibited fragrance ingredients: notes"))),
            "nota_fototoxicidad": " ".join(lines(get(r, "Restricted ingredients due to phototoxicity considerations: notes"))),
            "nota_restriccion": " ".join(lines(get(r, "Restricted ingredients: notes"))),
            "nota_especificacion": " ".join(lines(get(r, "Specified ingredients: notes"))),
            "contribuciones": get(r, "Contributions from other sources"),
            "nota_contribuciones": " ".join(lines(get(r, "Contributions from other sources: notes"))),
        }
        expressed = set()
        for c in CATEGORIES:
            value, how = cell(get(r, f"Category {c} (%)"))
            row[f"cat_{c.lower()}"] = value
            if how:
                expressed.add(how)
        row["limite_expresado_como"] = " ".join(sorted(expressed))
        # «See Notebox»: the substance as such is prohibited, and the note gives the
        # ceiling for what reaches the product from natural sources.
        limit = ""
        if any(row[f"cat_{c.lower()}"] == "ver-nota" for c in CATEGORIES):
            m = NOTE_LIMIT.search(row["nota_restriccion"])
            if not m:
                raise ValueError(f"{key}: «See Notebox» sin cifra en la nota")
            limit = number(m.group(1))
        row["limite_nota"] = limit
        std_rows.append(row)

        by_cas = synonyms_by_cas(get(r, "Synonyms"))
        seen = set()
        for cas, group in cas_groups(get(r, "CAS numbers")):
            if (cas, group) in seen:
                continue
            seen.add((cas, group))
            cas_rows.append({"estandar": key, "cas": cas, "grupo": group,
                             "sinonimos": " | ".join(by_cas.get(cas, []))})
    return std_rows, cas_rows, disclaimer


def annex(path: Path, std_cas: dict[str, list[str]], std_names: dict[str, str]) -> tuple[list[dict], list[dict], str]:
    sheets = read_xlsx(path)
    rows = sheets["Natural contributions"]
    intro = " ".join(x[0].strip() for x in rows[:3] if x and x[0].strip())
    head = rows[6]
    col = {name.strip(): i for i, name in enumerate(head)}

    def get(r: list[str], name: str) -> str:
        i = col[name]
        return r[i].strip() if i < len(r) else ""

    def standard_of(cas_text: str, name: str) -> str:
        keys = sorted({k for c in CAS_RE.findall(cas_text) for k in std_cas.get(c, [])})
        if not keys:
            # By name, only when a standard is called exactly that.
            keys = [k for k, n in std_names.items() if n.lower() == name.lower()]
        return " ".join(keys)

    natural = []
    for r in rows[7:]:
        if len(r) < 6 or not get(r, "NCS NAME"):
            continue
        cas_c = " ".join(CAS_RE.findall(get(r, "CAS NUMBER CONSTITUENT (IFRA STANDARD)")))
        name_c = get(r, "CONSTITUENT NAME (IFRA STANDARD)")
        raw = get(r, "CONCENTRATION OF CONSTITUENT IN NATURALS (NCS) (%)")
        natural.append({
            "enmienda": get(r, "IFRA Amendment (review)"),
            "categoria_iso": get(r, "NCS CATEGORY (ISO 9235 NORM) (see Appendix)"),
            "rifm_id": get(r, "RIFM IDENTIFICATION NUMBER OF NCS"),
            "cas_principal": " ".join(CAS_RE.findall(get(r, "PRINCIPAL CAS NUMBER OF NCS"))),
            "otros_cas": " ".join(CAS_RE.findall(get(r, "OTHER CAS NUMBERS OF NCS"))),
            "nombre": get(r, "NCS NAME"),
            "nombre_botanico": get(r, "NCS BOTANICAL NAME"),
            "cas_constituyente": cas_c,
            "constituyente": name_c,
            "concentracion_pct": number(raw.replace("..", ".")),
            "estandar_constituyente": standard_of(cas_c, name_c),
            # A typo in the original is read, and said: never corrected in silence.
            "aviso": f"IFRA escribe «{raw}»; se lee {number(raw.replace('..', '.'))}" if ".." in raw else "",
        })

    schiff = []
    s_rows = sheets["Schiff bases"]
    s_head = next(i for i, r in enumerate(s_rows) if r and r[0].strip() == "Aldehyde")
    for r in s_rows[s_head + 1:]:
        if len(r) < 5 or not r[0].strip():
            continue
        cas_a = " ".join(CAS_RE.findall(r[1]))
        schiff.append({
            "aldehido": r[0].strip(),
            "cas_aldehido": cas_a,
            "base_schiff": r[2].strip(),
            "cas_base_schiff": " ".join(CAS_RE.findall(r[3])),
            "nivel_aldehido_pct": number(r[4]),
            "estandar_aldehido": standard_of(cas_a, r[0].strip()),
        })
    return natural, schiff, intro


def main() -> None:
    n = sys.argv[1] if len(sys.argv) > 1 else "51"
    base = ROOT / "datos" / "ifra" / n
    origin = base / "origen"
    files = {name: origin / name.format(n=n) for name in (OVERVIEW, ANNEX, INDEX)}
    for path in files.values():
        if not path.exists():
            raise SystemExit(f"Falta el original: {path}")

    std_rows, cas_rows, disclaimer = standards(files[OVERVIEW])
    std_cas: dict[str, list[str]] = {}
    for r in cas_rows:
        std_cas.setdefault(r["cas"], []).append(r["estandar"])
    std_names = {r["estandar"]: r["nombre"] for r in std_rows}
    natural, schiff, intro = annex(files[ANNEX], std_cas, std_names)

    cats = [f"cat_{c.lower()}" for c in CATEGORIES]
    write(base / "estandares.csv",
          ["estandar", "nombre", "tipo", "prohibicion", "restriccion", "especificacion", *cats,
           "limite_expresado_como", "limite_nota", "enmienda", "publicaciones_anteriores",
           "ultima_publicacion", "plazo_creaciones_existentes", "plazo_creaciones_nuevas",
           "propiedad", "alcance_cas", "sinonimos", "nota_prohibicion", "nota_fototoxicidad",
           "nota_restriccion", "nota_especificacion", "contribuciones", "nota_contribuciones"],
          std_rows)
    write(base / "estandar-cas.csv", ["estandar", "cas", "grupo", "sinonimos"], cas_rows)
    write(base / "naturales.csv", list(natural[0].keys()), natural)
    write(base / "bases-schiff.csv", list(schiff[0].keys()), schiff)

    provenance = {
        "enmienda": n,
        "fuente": "IFRA, archivos de la enmienda descargados de su web por el usuario (2026-09-26)",
        "aviso_de_ifra": disclaimer,
        "anexo": intro,
        "convertido": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "originales": {p.name: {"sha256": sha256(p), "bytes": p.stat().st_size}
                       for p in files.values()},
        "cuentas": {
            "estandares": len(std_rows),
            "cas_distintos": len({r["cas"] for r in cas_rows}),
            "filas_de_naturales": len(natural),
            "naturales_distintos": len({r["nombre"] for r in natural}),
            "bases_schiff": len(schiff),
        },
    }
    (base / "procedencia.json").write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + "\n",
                                           encoding="utf-8", newline="\n")
    print(json.dumps(provenance["cuentas"], ensure_ascii=False))


if __name__ == "__main__":
    main()
