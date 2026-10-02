#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""El alta de materiales de la v2 (docs/v2/decisiones-v2.md, datos/v2/LEEME.md).

Lee las entradas de `docs/v2/altas/*.json`, en el orden de su nombre, y escribe todas las tablas
de `datos/v2/`. Es determinista: con las mismas entradas y el mismo registro, los mismos CSV.

* **Los ids salen del registro** (`datos/v2/registro-ids.csv`): una clave que ya tiene id lo
  conserva; una nueva toma el siguiente número de su entidad. Nunca se recalcula ninguno. Un id
  activo cuya clave ya no está en ninguna entrada pasa a `retirado`, y no se reutiliza.
* **IFRA sale de sus archivos** (`datos/ifra/51/`): el grupo de cada sustancia es el estándar en
  cuyo índice (`estandar-cas.csv`) está su CAS; un natural cuyo CAS está en el índice (el musgo de
  roble, STD 067) es miembro del grupo como material. Los límites no se copian.
* **La v1 se lee y nunca se toca**: el nombre de una sustancia es el del glosario para su CAS, y
  los productos documentados traen sus sustancias de `docs/proveedores/productos-sustancias.csv`
  y su tope de `docs/proveedores/productos.csv`, que escribe `registro_productos.py` desde el PDF.
* **Nada se fusiona en silencio**: un choque (la fuente da un estándar y el índice otro) va a
  `datos/v2/conflictos/<entrada>.csv`, y manda el índice de IFRA hasta que el usuario decida.

Uso:  python scripts/v2/alta.py      (después, `npm run validar:v2`)
"""
import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
V2 = ROOT / "datos" / "v2"
ALTAS = ROOT / "docs" / "v2" / "altas"
IFRA = ROOT / "datos" / "ifra" / "51"
GLOSARIO = ROOT / "datos" / "glosario"
PROVEEDORES = ROOT / "docs" / "proveedores"

PREFIX = {"sustancia": "S", "material": "M", "producto": "P", "lote": "L", "documento": "D", "grupo": "G"}

COLUMNS = {
    "registro-ids.csv": ["id", "entidad", "clave", "alta", "estado", "notas"],
    "sustancias.csv": ["id", "nombre", "notas"],
    "sustancia-cas.csv": ["id_sustancia", "cas", "relacion", "notas"],
    "grupos.csv": ["id", "tipo", "referencia", "nombre", "notas"],
    "grupo-miembros.csv": ["id_grupo", "id_miembro", "subgrupo", "notas"],
    "materiales.csv": [
        "id", "tipo", "nombre", "id_sustancia", "especie", "parte", "proceso", "quimiotipo",
        "cas", "inci", "excepciones", "motivo_excepcion", "notas",
    ],
    "composicion.csv": [
        "id_contenedor", "id_componente", "min", "tipico", "max", "tipo_valor", "autoridad",
        "id_documento", "notas",
    ],
    "coberturas.csv": ["id_contenedor", "id_documento", "cobertura", "notas"],
    "productos.csv": [
        "id", "id_material", "nombre", "fabricante", "codigo", "tienda", "url", "dilucion_pct",
        "id_diluyente", "notas",
    ],
    "topes.csv": ["id_producto", "categoria", "max_pct", "id_documento", "notas"],
    "lotes.csv": ["id", "id_producto", "codigo_lote", "fecha", "notas"],
    "documentos.csv": ["id", "tipo", "titulo", "emisor", "fecha", "ruta", "estado_revision", "notas"],
    "usos.csv": [
        "id_material", "magnitud", "min", "tipico", "max", "unidad", "base", "autoridad",
        "id_documento", "notas",
    ],
    "v1-a-v2.csv": ["id_v2", "id_v1"],
}


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def write_csv(name: str, rows: list[dict[str, str]]) -> None:
    columns = COLUMNS[name]
    with (V2 / name).open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=columns, lineterminator="\n")
        writer.writeheader()
        for row in rows:
            writer.writerow({c: row.get(c, "") for c in columns})


class Registry:
    """The ids of registro-ids.csv: assigned once, by (entity, key), never recalculated."""

    def __init__(self, rows: list[dict[str, str]]):
        self.rows = rows
        self.by_key = {(r["entidad"], r["clave"]): r for r in rows}
        self.used: set[str] = set()

    def id(self, entity: str, key: str, date: str, note: str = "") -> str:
        row = self.by_key.get((entity, key))
        if row is None:
            prefix = PREFIX[entity]
            taken = [int(r["id"][1:]) for r in self.rows if r["id"].startswith(prefix)]
            row = {"id": f"{prefix}{max(taken, default=0) + 1:05d}", "entidad": entity, "clave": key,
                   "alta": date, "estado": "activo", "notas": note}
            self.rows.append(row)
            self.by_key[(entity, key)] = row
        self.used.add(row["id"])
        return row["id"]

    def retire_unused(self) -> list[str]:
        retired = []
        for r in self.rows:
            if r["estado"] == "activo" and r["id"] not in self.used:
                r["estado"] = "retirado"
                retired.append(r["id"])
        return retired


def pct_text(text: str) -> str:
    """A percentage as the data writes it: decimal point, no trailing zeros."""
    value = text.strip().replace(",", ".").replace("%", "").strip()
    if "." in value:
        value = value.rstrip("0").rstrip(".")
    return value or "0"


def main() -> int:
    entries = sorted(ALTAS.glob("*.json"))
    if not entries:
        print("No hay entradas en docs/v2/altas/.")
        return 1

    # --- what is read, never written ------------------------------------------------------
    standards = {r["estandar"]: r for r in read_csv(IFRA / "estandares.csv")}
    index: dict[str, list[tuple[str, str]]] = {}
    for r in read_csv(IFRA / "estandar-cas.csv"):
        index.setdefault(r["cas"], []).append((r["estandar"], r["grupo"]))
    annex = read_csv(IFRA / "naturales.csv")
    v1_name: dict[str, str] = {}
    for r in read_csv(GLOSARIO / "materiales.csv"):
        if r["cas"] and r["clase"] == "molécula" and r["cas"] not in v1_name:
            v1_name[r["cas"]] = r["nombre"]
    made = {r["id"]: r for r in read_csv(PROVEEDORES / "productos.csv")}
    made_subs: dict[str, list[dict[str, str]]] = {}
    for r in read_csv(PROVEEDORES / "productos-sustancias.csv"):
        made_subs.setdefault(r["producto"], []).append(r)

    registry = Registry(read_csv(V2 / "registro-ids.csv"))
    tables: dict[str, list[dict[str, str]]] = {name: [] for name in COLUMNS if name != "registro-ids.csv"}
    substance_rows: dict[str, dict[str, str]] = {}
    groups: dict[str, str] = {}
    members: dict[tuple[str, str], dict[str, str]] = {}
    conflicts: dict[str, list[dict[str, str]]] = {}

    def group_id(standard: str, date: str) -> str:
        if standard not in groups:
            gid = registry.id("grupo", standard, date)
            groups[standard] = gid
            tables["grupos.csv"].append({"id": gid, "tipo": "estandar-ifra", "referencia": standard,
                                          "nombre": standards[standard]["nombre"]})
        return groups[standard]

    def member(standard: str, subgroup: str, member_id: str, date: str, note: str) -> None:
        gid = group_id(standard, date)
        members.setdefault((gid, member_id), {"id_grupo": gid, "id_miembro": member_id, "subgrupo": subgroup, "notas": note})

    def substance(cas: str, name: str, date: str, source_standard: str = "", lot: str = "") -> str:
        """The substance of a CAS, made once, with the groups IFRA's index gives that CAS."""
        sid = registry.id("sustancia", f"cas:{cas}", date)
        if sid not in substance_rows:
            known = v1_name.get(cas)
            substance_rows[sid] = {"id": sid, "nombre": known or name,
                                   "notas": "" if known else "nombre de la fuente: no está en el glosario v1"}
            tables["sustancia-cas.csv"].append({"id_sustancia": sid, "cas": cas, "relacion": "principal"})
            for standard, subgroup in index.get(cas, []):
                member(standard, subgroup, sid, date, "índice de IFRA 51")
        in_index = [s for s, _ in index.get(cas, [])]
        if source_standard and source_standard not in in_index:
            conflicts.setdefault(lot, []).append({
                "tipo": "estandar", "id": sid, "cas": cas,
                "fuente": source_standard, "indice": " ".join(in_index) or "(ninguno)",
                "decision": "manda el índice de IFRA hasta que lo decida el usuario",
            })
        return sid

    documents: dict[str, str] = {}
    v1_links: list[dict[str, str]] = []

    for path in entries:
        entry = json.loads(path.read_text(encoding="utf-8"))
        date = entry["fecha"]
        lot = path.stem

        for d in entry.get("documentos", []):
            did = registry.id("documento", d["clave"], date)
            documents[d["clave"]] = did
            tables["documentos.csv"].append({
                "id": did, "tipo": d["tipo"], "titulo": d["titulo"], "emisor": d["emisor"], "fecha": d["fecha"],
                "ruta": d["ruta"], "estado_revision": d["estado_revision"], "notas": d.get("notas", ""),
            })

        for m in entry["materiales"]:
            mid = registry.id("material", m["clave"], date)
            cas = m.get("cas", "")
            sid = ""
            if m["tipo"] == "sustancia":
                sid = substance(cas, m.get("nombre", cas), date, lot=lot)
            name = m.get("nombre") or substance_rows[sid]["nombre"]
            tables["materiales.csv"].append({
                "id": mid, "tipo": m["tipo"], "nombre": name, "id_sustancia": sid,
                "especie": m.get("especie", ""), "parte": m.get("parte", ""), "proceso": m.get("proceso", ""),
                "quimiotipo": m.get("quimiotipo", ""), "cas": cas, "inci": m.get("inci", ""),
                "notas": m.get("notas", ""),
            })
            # A natural or a base IFRA limits as itself (089, 184, the oakmoss of 067) is a member.
            if m["tipo"] in ("natural", "base") and cas:
                for standard, subgroup in index.get(cas, []):
                    member(standard, subgroup, mid, date, "índice de IFRA 51: limitado como tal")
            for v1 in m.get("v1", []):
                v1_links.append({"id_v2": mid, "id_v1": v1})

            # The annex: what IFRA gives for this natural, as typical values of its pure matter.
            has_rows = False
            if "anexo" in m:
                a = m["anexo"]
                did = documents[a["documento"]]
                rows = [r for r in annex if r["nombre"] == a["nombre"] and r["cas_principal"] == a["cas"]]
                if not rows:
                    print(f"{m['clave']}: el anexo no tiene «{a['nombre']}» ({a['cas']}).")
                    return 1
                for r in rows:
                    component = substance(r["cas_constituyente"], r["constituyente"], date, r["estandar_constituyente"], lot)
                    tables["composicion.csv"].append({
                        "id_contenedor": mid, "id_componente": component, "tipico": pct_text(r["concentracion_pct"]),
                        "tipo_valor": "tipico", "autoridad": "anexo-ifra", "id_documento": did,
                        "notas": f"{r['nombre']} ({r['nombre_botanico']})",
                    })
                tables["coberturas.csv"].append({
                    "id_contenedor": mid, "id_documento": did, "cobertura": "reguladas-completa",
                    "notas": "el anexo da las contribuciones a los estándares con límite; IFRA las da para el cálculo",
                })
                has_rows = True
            if m["tipo"] in ("natural", "base") and not has_rows:
                tables["coberturas.csv"].append({
                    "id_contenedor": mid, "cobertura": "desconocida",
                    "notas": "sin datos de sus constituyentes",
                })

            for p in m.get("productos", []):
                pid = registry.id("producto", p["clave"], date)
                tables["productos.csv"].append({
                    "id": pid, "id_material": mid, "nombre": p["nombre"], "fabricante": p.get("fabricante", ""),
                    "codigo": p.get("codigo", ""), "tienda": p.get("tienda", ""), "url": p.get("url", ""),
                    "notas": p.get("notas", ""),
                })
                cert = p.get("certificado")
                if not cert:
                    continue
                did = documents[cert["documento"]]
                own = {cas} if cas else set()
                for r in made_subs.get(cert["registro"], []):
                    all_cas = set(r["cas_todos"].split()) | {r["cas"]}
                    if own & all_cas:
                        # The material itself (oakmoss extracts 100 % of an oakmoss absolute): not a component.
                        continue
                    component = substance(r["cas"], r["sustancia"], date, lot=lot)
                    bound = r["cota"] == "sí"
                    tables["composicion.csv"].append({
                        "id_contenedor": pid, "id_componente": component,
                        **({"max": pct_text(r["pct"]), "tipo_valor": "maximo"} if bound else {"tipico": pct_text(r["pct"]), "tipo_valor": "tipico"}),
                        "autoridad": "producto", "id_documento": did,
                        "notas": "cota «<» del certificado" if bound else "",
                    })
                tables["coberturas.csv"].append({
                    "id_contenedor": pid, "id_documento": did, "cobertura": "reguladas-completa",
                    "notas": "el certificado IFRA declara todas las sustancias restringidas que lleva",
                })
                ceiling = made.get(cert["registro"], {}).get("tope_cat4_pct", "")
                if ceiling:
                    tables["topes.csv"].append({
                        "id_producto": pid, "categoria": "4", "max_pct": pct_text(ceiling), "id_documento": did,
                        "notas": f"tope de {p.get('fabricante', '')} para su producto (D4)",
                    })

    retired = registry.retire_unused()

    # --- write, in a stable order ----------------------------------------------------------
    tables["sustancias.csv"] = list(substance_rows.values())
    tables["grupo-miembros.csv"] = list(members.values())
    tables["v1-a-v2.csv"] = v1_links
    order = {
        "composicion.csv": lambda r: (r["id_contenedor"], r["id_documento"], r["id_componente"]),
        "coberturas.csv": lambda r: (r["id_contenedor"], r.get("id_documento", "")),
        "grupo-miembros.csv": lambda r: (r["id_grupo"], r["id_miembro"]),
        "sustancia-cas.csv": lambda r: (r["id_sustancia"], r["cas"]),
        "topes.csv": lambda r: (r["id_producto"], r["categoria"]),
        "v1-a-v2.csv": lambda r: (r["id_v1"], r["id_v2"]),
    }
    for name, rows in tables.items():
        rows.sort(key=order.get(name, lambda r: r["id"]))
        write_csv(name, rows)
    write_csv("registro-ids.csv", sorted(registry.rows, key=lambda r: r["id"]))

    conflict_dir = V2 / "conflictos"
    for lot, rows in conflicts.items():
        conflict_dir.mkdir(exist_ok=True)
        with (conflict_dir / f"{lot}.csv").open("w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=["tipo", "id", "cas", "fuente", "indice", "decision"], lineterminator="\n")
            writer.writeheader()
            writer.writerows(rows)

    counts = ", ".join(f"{len(tables[n])} {n.removesuffix('.csv')}" for n in ("materiales.csv", "productos.csv", "sustancias.csv", "grupos.csv", "composicion.csv"))
    print(f"datos/v2: {counts}.")
    if retired:
        print(f"Retirados: {', '.join(retired)}.")
    for lot, rows in conflicts.items():
        print(f"{len(rows)} conflictos en datos/v2/conflictos/{lot}.csv: los decide el usuario.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
