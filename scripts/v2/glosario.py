# -*- coding: utf-8 -*-
"""Fase 6: el resto del glosario v1 en la v2, por clase y en lotes de 300 como máximo.

De la v1 se toman solo la **identidad** (el nombre y el CAS del FIG) y los **datos de IFRA** (el índice de estándares, el anexo de naturales
y las bases de Schiff). **Ningún documento ni lista de producto de la v1 pasa a la v2** (D6, D9). Lo que no tiene conflicto entra como
sustancia con origen «desconocido» (D7) y con la autoridad de su fuente, que es el anexo de IFRA o ninguna: nunca mejor. Lo que sí lo tiene
no entra: se clasifica solo, en `datos/v2/conflictos/<lote>.csv`, con su evidencia (la frase del glosario o de IFRA, o «no lo dice»).

Cada lote se congela en `docs/v2/glosario-lotes.json` (sus ids no cambian aunque entren otros). Lo que usa la biblioteca del usuario
(`docs/v2/glosario-despues.csv`) queda para el final. Escribe:

* `docs/v2/altas/<fecha>-glosario-<lote>.json`: la alta de lo que entra (la lee `alta.py`);
* `docs/v2/enlaces-glosario.csv`: las filas de la v1 que son una sustancia que la v2 ya tenía (por su CAS);
* `datos/v2/conflictos/<lote>.csv`: lo que no entra, por categoría.

Uso:
    python scripts/v2/glosario.py --nuevo molécula     congela el siguiente lote de esa clase y lo prepara
    python scripts/v2/glosario.py                      vuelve a preparar los lotes congelados (determinista)
Después, `python scripts/v2/alta.py` escribe los datos.
"""
import argparse
import csv
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
V2 = ROOT / "datos" / "v2"
DOCS = ROOT / "docs" / "v2"
IFRA = ROOT / "datos" / "ifra" / "51"
GLOSARIO = ROOT / "datos" / "glosario"
LOT_SIZE = 300
CONFLICT_COLUMNS = ["producto", "tipo", "detalle", "evidencia", "recomendacion", "respuesta"]

CATEGORIES = {
    "sin-cas": "El glosario no da CAS: sin CAS no hay identidad (D1).",
    "cas-de-otro-material": "El CAS es de un natural o una base que la v2 ya tiene: no es la misma cosa.",
    "estandar-por-nombre": "La v1 le da un estándar de IFRA que el índice no liga a su CAS (lo encontró por el nombre).",
    "familia-por-nombre": "La v1 le da un estándar de familia (188, 184, 089) por el nombre, con una regex: no hay lista de IFRA que lo respalde.",
}


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def write_csv(path: Path, columns: list[str], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=columns, lineterminator="\n")
        writer.writeheader()
        writer.writerows({c: r.get(c, "") for c in columns} for r in rows)


def sort_key(ident: str) -> tuple:
    prefix, _, rest = ident.partition(":")
    number = re.fullmatch(r"\d+", rest)
    return (0 if prefix == "fig" else 1, prefix, int(rest) if number else 0, rest)


def valid_cas(cas: str) -> bool:
    m = re.fullmatch(r"(\d{2,7})-(\d{2})-(\d)", cas)
    if not m:
        return False
    digits = m.group(1) + m.group(2)
    return sum(int(d) * (i + 1) for i, d in enumerate(reversed(digits))) % 10 == int(m.group(3))


class Data:
    """What is read, never written."""

    def __init__(self) -> None:
        self.glossary = {r["id"]: r for r in read_csv(GLOSARIO / "materiales.csv")}
        self.standards = {r["estandar"]: r for r in read_csv(IFRA / "estandares.csv")}
        self.index: dict[str, list[str]] = defaultdict(list)
        self.standard_cas: dict[str, list[str]] = defaultdict(list)
        for r in read_csv(IFRA / "estandar-cas.csv"):
            self.index[r["cas"]].append(r["estandar"])
            self.standard_cas[r["estandar"]].append(r["cas"])
        self.schiff: dict[str, list[dict[str, str]]] = defaultdict(list)
        for r in read_csv(IFRA / "bases-schiff.csv"):
            for cas in r["cas_base_schiff"].split():
                self.schiff[cas].append(r)
        self.later = {r["id_v1"] for r in read_csv(DOCS / "glosario-despues.csv")}
        # What the v2 had before the glossary lots: the materials these lots made (key «glosario-…») are not «what was there».
        made_here = {r["id"] for r in read_csv(V2 / "registro-ids.csv") if r["entidad"] == "material" and r["clave"].startswith("glosario-")}
        self.materials = [m for m in read_csv(V2 / "materiales.csv") if m["id"] not in made_here]
        self.linked = {r["id_v1"] for r in read_csv(V2 / "v1-a-v2.csv") if r["id_v2"] not in made_here}
        self.cas_of_material = {m["cas"]: m for m in self.materials if m["cas"]}


def classify(g: dict[str, str], data: Data) -> tuple[str, str, str]:
    """(category or «entra», detail, evidence) of one molecule of the glossary."""
    cas = g["cas"]
    if not cas or not valid_cas(cas):
        return "sin-cas", f"{g['id']} «{g['nombre']}»", f"no lo dice: el glosario no da un CAS válido para {g['id']} (CAS: «{cas}»)"
    other = data.cas_of_material.get(cas)
    if other is not None and other["tipo"] != "sustancia":
        return ("cas-de-otro-material", f"{cas} es de {other['id']} «{other['nombre']}» ({other['tipo']})",
                f"la v2 tiene el CAS {cas} en el material {other['id']} «{other['nombre']}», que es un {other['tipo']}")
    note = g["condiciones"]
    if "familia, por el nombre" in note:
        return "familia-por-nombre", note[:160], f"«{note[:200]}»"
    own = set(filter(None, re.split(r"[;,\s]+", g["estandares"])))
    indexed = set(data.index.get(cas, []))
    if own and own != indexed:
        std = sorted(own - indexed)[0]
        name = data.standards[std]["nombre"] if std in data.standards else std
        listed = " ".join(data.standard_cas.get(std, [])[:4]) or "(ninguno)"
        said = f"; el glosario dice: «{g['fuera_de_ifra'][:120]}»" if g["fuera_de_ifra"] else ""
        return ("estandar-por-nombre", f"{std} «{name}»",
                f"la v1 le da {std} («{name}»); el índice de IFRA no liga el CAS {cas} a ese estándar (sus CAS: {listed}){said}")
    return "entra", "", ""


def freeze_next(clase: str, lots: dict, data: Data, date: str) -> str | None:
    taken = {i for lot in lots.values() for i in lot["ids"]}
    pending = sorted(
        (i for i, g in data.glossary.items() if g["clase"] == clase and i not in data.linked and i not in data.later and i not in taken),
        key=sort_key,
    )
    if not pending:
        return None
    name = "6" + "abcdefghijklmnopqrstuvwxyz"[len(lots)]
    lots[name] = {"clase": clase, "fecha": date, "ids": pending[:LOT_SIZE]}
    return name


def prepare(name: str, lot: dict, data: Data) -> tuple[Counter, dict, list[dict[str, str]], list[dict[str, str]]]:
    """The entry of a lot, its conflicts and its links to substances the v2 already had."""
    if lot["clase"] != "molécula":
        raise SystemExit(f"{name}: la clase «{lot['clase']}» aún no tiene lote preparado.")
    counts: Counter = Counter()
    conflicts: list[dict[str, str]] = []
    by_cas: dict[str, list[dict[str, str]]] = {}
    links: list[dict[str, str]] = []
    for ident in lot["ids"]:
        g = data.glossary[ident]
        category, detail, evidence = classify(g, data)
        if category != "entra":
            counts[category] += 1
            conflicts.append({"producto": f"{ident} «{g['nombre']}»", "tipo": category, "detalle": detail, "evidencia": evidence,
                              "recomendacion": "no entra hasta que el usuario decida la categoría", "respuesta": ""})
            continue
        existing = data.cas_of_material.get(g["cas"])
        if existing is not None:
            counts["enlazada a una sustancia de la v2"] += 1
            links.append({"id_v1": ident, "id_v2": existing["id"], "id_producto": "", "confirmado": "",
                          "motivo": f"Fase 6, lote {name}: el mismo CAS ({g['cas']}) que la sustancia de la v2"})
            continue
        by_cas.setdefault(g["cas"], []).append(g)
    materials = []
    for cas, rows in by_cas.items():
        first = rows[0]
        entry = {
            "clave": f"glosario-{cas}", "tipo": "sustancia", "nombre": first["nombre"], "cas": cas, "origen": "desconocido",
            "origen_fuente": "el FIG no dice si es natural o de síntesis, y no hay documento (D6, D7)",
            "v1": [r["id"] for r in rows],
            "notas": f"Fase 6, lote {name}: la identidad es la del FIG y los estándares son los del índice de IFRA 51; "
                     "ningún documento ni lista de producto de la v1 (D6, D9).",
        }
        schiff = data.schiff.get(cas)
        if schiff:
            entry["schiff"] = {"documento": "ifra51-bases-schiff", "cas": cas}
            counts["entra con el aldehído de IFRA (base de Schiff)"] += 1
        counts["entra"] += 1
        if len(rows) > 1:
            counts["varias filas del glosario con el mismo CAS (una sustancia)"] += len(rows) - 1
        materials.append(entry)
    documents = []
    if any("schiff" in m for m in materials):
        documents.append({
            "clave": "ifra51-bases-schiff", "tipo": "anexo-ifra", "titulo": "IFRA 51, bases de Schiff: el aldehído que lleva cada una",
            "emisor": "IFRA", "fecha": "2023-06", "ruta": "datos/ifra/51/bases-schiff.csv", "estado_revision": "revisado",
            "notas": "Archivo oficial de IFRA convertido por scripts/importar_ifra.py; sus cifras se toman tal cual.",
        })
    entry_file = {
        "fecha": lot["fecha"],
        "notas": f"Fase 6, lote {name}: {len(lot['ids'])} moléculas del glosario v1 (identidad del FIG y datos de IFRA).",
        "documentos": documents,
        "materiales": materials,
    }
    return counts, entry_file, conflicts, links


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--nuevo", help="clase de la que se congela el siguiente lote (molécula, natural, base)")
    args = parser.parse_args()
    data = Data()
    path = DOCS / "glosario-lotes.json"
    lots = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    newest = None
    if args.nuevo:
        newest = freeze_next(args.nuevo, lots, data, "2026-10-03")
        if newest is None:
            print(f"No quedan filas de la clase «{args.nuevo}».")
            return 1
        path.write_text(json.dumps(lots, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    all_links: list[dict[str, str]] = []
    results = {}
    for name, lot in lots.items():
        counts, built, conflicts, links = prepare(name, lot, data)
        (DOCS / "altas" / f"{lot['fecha']}-glosario-{name}.json").write_text(
            json.dumps(built, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        write_csv(V2 / "conflictos" / f"{name}.csv", CONFLICT_COLUMNS, conflicts)
        all_links.extend(links)
        results[name] = (counts, conflicts)
    write_csv(DOCS / "enlaces-glosario.csv", ["id_v1", "id_v2", "id_producto", "confirmado", "motivo"], all_links)
    name = newest or list(lots)[-1]
    lot = lots[name]
    counts, conflicts = results[name]
    print(f"Lote {name}: {len(lot['ids'])} filas de la clase «{lot['clase']}».\n")
    for k, v in counts.most_common():
        print(f"  {v:5}  {k}")
    by_category: dict[str, list[dict[str, str]]] = defaultdict(list)
    for c in conflicts:
        by_category[c["tipo"]].append(c)
    for category, items in by_category.items():
        print(f"\n[{category}] {len(items)}: {CATEGORIES[category]}")
        for c in items[:5]:
            print(f"   - {c['producto'][:60]} | {c['evidencia'][:230]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
