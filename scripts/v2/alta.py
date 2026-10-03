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

Los **lotes** (`docs/v2/lotes.json`, módulo `lote.py`) toman los productos de
`docs/proveedores/mis-productos.csv` y proponen su material desde la v1. Cada ejecución escribe
`datos/v2/propuestas/<lote>.csv` y `datos/v2/conflictos/<lote>.csv`; un lote entra en los datos
solo cuando `datos/v2/respuestas/<lote>.csv` contesta todos sus conflictos.

Uso:  python scripts/v2/alta.py [--lote 3a]      (después, `npm run validar:v2`)
      Con --lote, imprime el resumen de ese lote: recuento por tipo y tabla de conflictos.
"""
import argparse
import csv
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import lote as lots  # noqa: E402

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
        "cas", "inci", "origen", "excepciones", "motivo_excepcion", "notas",
    ],
    "composicion.csv": [
        "id_contenedor", "id_componente", "min", "tipico", "max", "tipo_valor", "autoridad",
        "id_documento", "notas",
    ],
    "coberturas.csv": ["id_contenedor", "id_documento", "cobertura", "notas"],
    "productos.csv": [
        "id", "id_material", "nombre", "fabricante", "codigo", "tienda", "url", "notas",
    ],
    "topes.csv": ["id_producto", "categoria", "max_pct", "id_documento", "notas"],
    "lotes.csv": ["id", "id_producto", "codigo_lote", "fecha", "notas"],
    "documentos.csv": ["id", "tipo", "titulo", "emisor", "fecha", "ruta", "estado_revision", "notas"],
    "usos.csv": [
        "id_material", "magnitud", "min", "tipico", "max", "unidad", "base", "autoridad",
        "id_documento", "notas",
    ],
    "impurezas-conocidas.csv": ["id_sustancia", "id_documento", "notas"],
    "condiciones.csv": ["id_contenedor", "estandar", "condicion", "autoridad", "id_documento", "notas"],
    "exclusiones.csv": ["estandar", "procesos", "notas"],
    "v1-a-v2.csv": ["id_v2", "id_v1"],
}

ORIGINS = ("sintetico", "aislado-natural", "desconocido")

# STD 089 limits the 5-MOP (bergapten) of the citrus oils, not the oil: the standard has no CAS in the
# index, so its constituent is named here. A substance that is a member of it is added up with the
# phototoxic oils (src/v2/to-ifra.ts).
FIVE_MOP_CAS = "484-20-8"
FIVE_MOP_NAME = "5-MOP (bergapteno)"
FIVE_MOP_STANDARD = "IFRA_STD_089"


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
        if row is not None and row["estado"] == "retirado":
            # The same key coming back (a lot that was waiting for answers) takes its own id again;
            # a retired id is never given to another key.
            row["estado"] = "activo"
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
    parser = argparse.ArgumentParser(description="Alta de materiales de la v2.")
    parser.add_argument("--lote", help="lote de docs/v2/lotes.json cuyo resumen se imprime")
    args = parser.parse_args()
    entries = [(path.stem, json.loads(path.read_text(encoding="utf-8"))) for path in sorted(ALTAS.glob("*.json"))]
    if not entries:
        print("No hay entradas en docs/v2/altas/.")
        return 1
    lot_specs = json.loads((ROOT / "docs" / "v2" / "lotes.json").read_text(encoding="utf-8"))["lotes"]
    if args.lote and args.lote not in lot_specs:
        print(f"No hay lote «{args.lote}» en docs/v2/lotes.json.")
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

    def norm(text: str) -> str:
        return text.strip().lower()

    natural_standards = [
        {"estandar": r["estandar"], "nombre_ifra": r["nombre_ifra"],
         "especies": {norm(x) for x in r["especies"].split(";")},
         "partes": [norm(x) for x in r["partes"].split(";")],
         "procesos": [norm(x) for x in r["procesos"].split(";")],
         "excluye": [norm(x) for x in r["excluye"].split(";") if x.strip()]}
        for r in read_csv(ROOT / "docs" / "v2" / "estandares-naturales.csv")
    ]

    registry = Registry(read_csv(V2 / "registro-ids.csv"))
    # The specifications that do not apply to some processes (a styrax resinoid is outside the PAH specification
    # of the pyrolysis oil): written as they are, for the adapter.
    exclusions = [{"estandar": r["estandar"], "procesos": r["procesos"], "notas": r["fuente"]}
                  for r in read_csv(ROOT / "docs" / "v2" / "especificaciones-excluidas.csv")]
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
            if cas == FIVE_MOP_CAS:
                member(FIVE_MOP_STANDARD, "", sid, date, "el STD 089 limita el 5-MOP, que su índice no lista por CAS")
        in_index = [s for s, _ in index.get(cas, [])]
        if source_standard and source_standard not in in_index:
            conflicts.setdefault(lot, []).append({
                "producto": sid, "tipo": "estandar",
                "detalle": f"CAS {cas}: la fuente da {source_standard}; el índice, {' '.join(in_index) or '(ninguno)'}",
                "recomendacion": "manda el índice de IFRA hasta que lo decida el usuario",
            })
        return sid

    documents: dict[str, str] = {}

    def add_conditions(container: str, items: list[dict]) -> None:
        """The claims that meet an IFRA specification (condiciones.csv), of a material or of a product."""
        for c in items:
            tables["condiciones.csv"].append({
                "id_contenedor": container, "estandar": c["estandar"], "condicion": c["condicion"],
                "autoridad": c["autoridad"], "id_documento": documents[c["documento"]] if c.get("documento") else "",
                "notas": c.get("notas", ""),
            })

    v1_links: list[dict[str, str]] = []

    # The lots go after the entries, each one seeing what is already given: a product is never
    # given twice, and a molecule already in the data takes its new products.
    known_products = {p["clave"] for _, e in entries for m in e["materiales"] for p in m.get("productos", [])}
    known_cas = {m["cas"]: m["clave"] for _, e in entries for m in e["materiales"] if m["tipo"] == "sustancia" and m.get("cas")}
    summaries: dict[str, tuple[list[dict[str, str]], list[dict[str, str]]]] = {}
    known_names = {p["nombre"] for _, e in entries for m in e["materiales"] for p in m.get("productos", [])}
    for name, spec in lot_specs.items():
        entry, proposals, lot_conflicts = lots.plan(name, spec, ROOT, index, known_products, known_cas, known_names)
        summaries[name] = (proposals, lot_conflicts)
        conflicts.setdefault(name, []).extend(lot_conflicts)
        entries.append((name, entry))
        for m in entry["materiales"]:
            known_cas.setdefault(m["cas"], m["clave"])
            known_products.update(p["clave"] for p in m["productos"])
            known_names.update(p["nombre"] for p in m["productos"])

    seen_materials: dict[str, str] = {}
    for lot, entry in entries:
        date = entry["fecha"]

        for d in entry.get("documentos", []):
            did = registry.id("documento", d["clave"], date)
            documents[d["clave"]] = did
            tables["documentos.csv"].append({
                "id": did, "tipo": d["tipo"], "titulo": d["titulo"], "emisor": d["emisor"], "fecha": d["fecha"],
                "ruta": d["ruta"], "estado_revision": d["estado_revision"], "notas": d.get("notas", ""),
            })

        for m in entry["materiales"]:
            if m["clave"] in seen_materials:
                # A molecule already given takes only its new products (a later lot).
                mid = seen_materials[m["clave"]]
                for p in m.get("productos", []):
                    pid = registry.id("producto", p["clave"], date)
                    tables["productos.csv"].append({
                        "id": pid, "id_material": mid, "nombre": p["nombre"], "fabricante": p.get("fabricante", ""),
                        "codigo": p.get("codigo", ""), "tienda": p.get("tienda", ""), "url": p.get("url", ""),
                        "notas": p.get("notas", ""),
                    })
                    add_conditions(pid, p.get("condiciones", []))
                continue
            mid = registry.id("material", m["clave"], date)
            seen_materials[m["clave"]] = mid
            add_conditions(mid, m.get("condiciones", []))
            cas = m.get("cas", "")
            sid = ""
            origin = m.get("origen", "")
            if m["tipo"] == "sustancia" and origin not in ORIGINS:
                print(f"{m['clave']}: una sustancia necesita «origen» ({', '.join(ORIGINS)}) (D7).")
                return 1
            if m["tipo"] == "sustancia":
                sid = substance(cas, m.get("nombre", cas), date, lot=lot)
            name = m.get("nombre") or substance_rows[sid]["nombre"]
            tables["materiales.csv"].append({
                "id": mid, "tipo": m["tipo"], "nombre": name, "id_sustancia": sid,
                "especie": m.get("especie", ""), "parte": m.get("parte", ""), "proceso": m.get("proceso", ""),
                "quimiotipo": m.get("quimiotipo", ""), "cas": cas, "inci": m.get("inci", ""),
                "origen": origin,
                "notas": " ".join(n for n in (m.get("notas", ""), f"Origen: {m['origen_fuente']}" if m.get("origen_fuente") else "") if n),
            })
            # A natural or a base IFRA limits as itself (089, 184, the oakmoss of 067) is a member.
            if m["tipo"] in ("natural", "base") and cas:
                for standard, subgroup in index.get(cas, []):
                    member(standard, subgroup, mid, date, "índice de IFRA 51: limitado como tal")
            # The standards of naturals (086-096) are also recognised by species + part + process (D1), not only by
            # the CAS of the index: the FCF bergamot is a bergamot oil expressed whose CAS the index does not list.
            if m["tipo"] == "natural":
                for rule in natural_standards:
                    if (norm(m.get("especie", "")) in rule["especies"]
                            and any(x in norm(m.get("parte", "")) for x in rule["partes"])
                            and any(x in norm(m.get("proceso", "")) for x in rule["procesos"])
                            # A different process is not the standard's oil: the FCF bergamot is not the 087.
                            and not any(x in norm(m.get("proceso", "")) for x in rule["excluye"])):
                        member(rule["estandar"], "", mid, date,
                               f"por especie, parte y proceso (D1): «{rule['nombre_ifra']}»")
            # A standard that goes by family (089, 184, 188) applies by what the material is, not by
            # its CAS: it is a member of the group as a material.
            for standard in m.get("familias", []):
                member(standard, "", mid, date, "familia: el estándar le aplica por lo que es, aunque el índice no liste su CAS")
            for v1 in m.get("v1", []):
                v1_links.append({"id_v2": mid, "id_v1": v1})

            # The typical levels of furocoumarins that STD 089 gives for three oils, as composition with the
            # authority of the annex (not used yet by any material: it is declared by key).
            typical = False
            if m.get("niveles_089"):
                level = next(r for r in read_csv(ROOT / "docs" / "v2" / "niveles-tipicos-089.csv") if r["clave"] == m["niveles_089"])
                if "ifra51-estandares" not in documents:
                    ddid = registry.id("documento", "ifra51-estandares", date)
                    documents["ifra51-estandares"] = ddid
                    tables["documentos.csv"].append({
                        "id": ddid, "tipo": "anexo-ifra", "titulo": "IFRA 51, estándares: nota de fototoxicidad del STD 089",
                        "emisor": "IFRA", "fecha": "2023-06", "ruta": "datos/ifra/51/estandares.csv", "estado_revision": "revisado",
                        "notas": "Archivo oficial de IFRA convertido por scripts/importar_ifra.py.",
                    })
                from fractions import Fraction as _F
                percent = _F(level["ppm"]) / 10000
                tables["composicion.csv"].append({
                    "id_contenedor": mid, "id_componente": substance(FIVE_MOP_CAS, FIVE_MOP_NAME, date, lot=lot),
                    "tipico": format(float(percent), "f").rstrip("0").rstrip("."), "tipo_valor": "tipico", "autoridad": "anexo-ifra",
                    "id_documento": documents["ifra51-estandares"], "notas": level["fuente"],
                })
                tables["coberturas.csv"].append({
                    "id_contenedor": mid, "id_documento": documents["ifra51-estandares"], "cobertura": "parcial",
                    "notas": "solo el nivel típico de furocumarinas que da el STD 089",
                })
                typical = True

            # Placeholders of the literature (D2): the figures of a reviewed document of another supplier
            # for this same material, each with the coverage the document declares.
            literature_rows = False
            for lit in m.get("literatura", []):
                did = documents[lit["documento"]]
                for cas_l, name_l, value, kind_l in lit["filas"]:
                    component = substance(cas_l, name_l, date, lot=lot)
                    tables["composicion.csv"].append({
                        "id_contenedor": mid, "id_componente": component,
                        **({"max": value} if kind_l == "maximo" else {"tipico": value}),
                        "tipo_valor": kind_l, "autoridad": "literatura", "id_documento": did, "notas": lit["notas"],
                    })
                    literature_rows = True
                tables["coberturas.csv"].append({
                    "id_contenedor": mid, "id_documento": did, "cobertura": lit["cobertura"],
                    "notas": "lo que declara el documento, de otro proveedor",
                })

            # The annex: what IFRA gives for this natural, as typical values of its pure matter.
            has_rows = False
            if "anexo" in m:
                a = m["anexo"]
                did = documents[a["documento"]]
                rows = [r for r in annex if r["nombre"] == a["nombre"] and (r["cas_principal"] == a["cas"] or a["cas"] in r["otros_cas"].split())]
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
            has_rows = has_rows or literature_rows or typical
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
                add_conditions(pid, p.get("condiciones", []))
                cert = p.get("certificado")
                if not cert:
                    continue
                did = documents[cert["documento"]]
                own = {cas} if cas else set()
                # A certificate of a diluted product (D8): the figures go to pure matter, and the cap is the pure one.
                from decimal import Decimal, localcontext
                from fractions import Fraction as _Fr
                fraction = _Fr(cert["escala"]) / 100 if cert.get("escala") else _Fr(1)

                def pure(text: str, divide: bool) -> str:
                    value = _Fr(text) / fraction if divide else _Fr(text) * fraction
                    with localcontext() as ctx:
                        ctx.prec = 12
                        return pct_text(format(Decimal(value.numerator) / Decimal(value.denominator), "f"))
                for r in made_subs.get(cert["registro"], []):
                    all_cas = set(r["cas_todos"].split()) | {r["cas"]}
                    if own & all_cas:
                        # The material itself (oakmoss extracts 100 % of an oakmoss absolute): not a component.
                        continue
                    component = substance(r["cas"], r["sustancia"], date, lot=lot)
                    bound = r["cota"] == "sí"
                    tables["composicion.csv"].append({
                        "id_contenedor": pid, "id_componente": component,
                        **({"max": pure(r["pct"], True), "tipo_valor": "maximo"} if bound else {"tipico": pure(r["pct"], True), "tipo_valor": "tipico"}),
                        "autoridad": "producto", "id_documento": did,
                        "notas": ("cota «<» del certificado" if bound else "") + (f"; pasada a materia pura (el certificado es de un producto al {cert['escala']} %)" if cert.get("escala") else ""),
                    })
                tables["coberturas.csv"].append({
                    "id_contenedor": pid, "id_documento": did, "cobertura": "reguladas-completa",
                    "notas": "el certificado IFRA declara todas las sustancias restringidas que lleva",
                })
                ceiling = made.get(cert["registro"], {}).get("tope_cat4_pct", "")
                if ceiling:
                    tables["topes.csv"].append({
                        "id_producto": pid, "categoria": "4", "max_pct": pure(ceiling, False), "id_documento": did,
                        "notas": f"tope de {p.get('fabricante', '')} para su producto (D4)",
                    })

        # D7: the molecules known to carry regulated impurities, each with its source.
        for k in entry.get("impurezas_conocidas", []):
            sid = substance(k["cas"], k.get("nombre", k["cas"]), date, lot=lot)
            tables["impurezas-conocidas.csv"].append({
                "id_sustancia": sid, "id_documento": documents[k["documento"]], "notas": k.get("notas", ""),
            })

    retired = registry.retire_unused()

    # --- write, in a stable order ----------------------------------------------------------
    tables["exclusiones.csv"] = exclusions
    tables["sustancias.csv"] = list(substance_rows.values())
    tables["grupo-miembros.csv"] = list(members.values())
    tables["v1-a-v2.csv"] = v1_links
    order = {
        "composicion.csv": lambda r: (r["id_contenedor"], r["id_documento"], r["id_componente"]),
        "coberturas.csv": lambda r: (r["id_contenedor"], r.get("id_documento", "")),
        "grupo-miembros.csv": lambda r: (r["id_grupo"], r["id_miembro"]),
        "sustancia-cas.csv": lambda r: (r["id_sustancia"], r["cas"]),
        "topes.csv": lambda r: (r["id_producto"], r["categoria"]),
        "impurezas-conocidas.csv": lambda r: (r["id_sustancia"], r["id_documento"]),
        "condiciones.csv": lambda r: (r["id_contenedor"], r["estandar"]),
        "exclusiones.csv": lambda r: (r["estandar"],),
        "v1-a-v2.csv": lambda r: (r["id_v1"], r["id_v2"]),
    }
    for name, rows in tables.items():
        rows.sort(key=order.get(name, lambda r: r["id"]))
        write_csv(name, rows)
    write_csv("registro-ids.csv", sorted(registry.rows, key=lambda r: r["id"]))

    for lot, rows in conflicts.items():
        if rows or lot in summaries:
            lots.write(V2 / "conflictos" / f"{lot}.csv", lots.CONFLICT_COLUMNS, rows)
    for lot, (proposals, _) in summaries.items():
        lots.write(V2 / "propuestas" / f"{lot}.csv", lots.PROPOSAL_COLUMNS, proposals)

    counts = ", ".join(f"{len(tables[n])} {n.removesuffix('.csv')}" for n in ("materiales.csv", "productos.csv", "sustancias.csv", "grupos.csv", "composicion.csv"))
    print(f"datos/v2: {counts}.")
    if retired:
        print(f"Retirados: {', '.join(retired)}.")
    for lot, rows in conflicts.items():
        if lot not in summaries and rows:
            print(f"{len(rows)} conflictos en datos/v2/conflictos/{lot}.csv: los decide el usuario.")
    if args.lote:
        print_summary(args.lote, *summaries[args.lote])
    return 0


def print_summary(lot: str, proposals: list[dict[str, str]], conflicts: list[dict[str, str]]) -> None:
    """What the user reads of a lot: products by state, conflicts by type, one line per product."""
    states: dict[str, int] = {}
    for p in proposals:
        states[p["estado"]] = states.get(p["estado"], 0) + 1
    kinds: dict[str, int] = {}
    for c in conflicts:
        kinds[c["tipo"]] = kinds.get(c["tipo"], 0) + 1
    open_ = [c for c in conflicts if not c["respuesta"]]
    print(f"\nLote {lot}: {len(proposals)} productos ({', '.join(f'{n} {k}' for k, n in sorted(states.items()))}).")
    print(f"Conflictos: {len(conflicts)} ({', '.join(f'{n} {k}' for k, n in sorted(kinds.items())) or 'ninguno'}); sin respuesta: {len(open_)}.")
    by_product: dict[str, list[dict[str, str]]] = {}
    for c in conflicts:
        by_product.setdefault(c["producto"], []).append(c)
    for product, rows in by_product.items():
        shape = next((c for c in rows if c["tipo"] == "forma"), None)
        if shape:
            # A natural: the evidence of its shop page and the proposal, then the rest in a line.
            evidence, _, proposal = shape["detalle"].partition(" || ")
            answer = shape["respuesta"] or "propongo " + shape["recomendacion"].replace("|", " / ")
            print(f"  {product}: forma → {answer}")
            print(f"      evidencia: {evidence[:230]}")
            rest = [c for c in rows if c is not shape]
            if rest:
                print("      " + " ; ".join(f"{c['tipo']} → {c['respuesta'] or 'recomiendo ' + c['recomendacion']}" for c in rest))
            continue
        parts = [f"{c['tipo']} [{c['detalle'][:140]}] → {c['respuesta'] or 'recomiendo ' + c['recomendacion']}" for c in rows]
        print(f"  {product}: " + " ; ".join(parts))


if __name__ == "__main__":
    sys.exit(main())
