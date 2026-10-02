# -*- coding: utf-8 -*-
"""Un lote de alta de la v2: los productos de `mis-productos.csv` que filtra `docs/v2/lotes.json`.

Para cada producto propone su material a partir de su fila de la v1 (que solo se lee) y busca lo
que necesita una decisión del usuario. Las respuestas están en `datos/v2/respuestas/<lote>.csv`:
con todas contestadas, el lote entra en los datos; si falta alguna, solo se escriben la propuesta
y los conflictos. Lo usa `alta.py`.

Tipos de conflicto y sus respuestas (`excluir` vale en todos: el producto no entra en el lote):
* `forma-natural`: un natural con varias filas de forma en la v1. Respuesta: `v1:<id>`.
* `documento-ajeno`: la fila de la v1 trae sustancias de un documento que no es de este producto
  (su nombre o su CAS no coinciden). Respuesta: `no-traer` (D3: no se traen).
* `estados-ifra`: el mismo CAS tiene estados de IFRA distintos en la v1. Respuesta: `v1:<id>`,
  la fila que le corresponde.
* `ifra-distinto`: los estándares de la fila de la v1 no son los del índice de IFRA para su CAS.
  Respuesta: `familia` (la v1 lo encontró por un estándar de familia, 089, 184 o 188, que no lista
  su CAS pero le aplica; el material entra como miembro del grupo) o `indice` (manda el índice).
  La tabla explica el estándar. Con familia, se recomienda `familia`.
* `suma`: los constituyentes de la fila de la v1 suman más del 100,5 %. Respuesta: `no-traer`.
* `sin-fila-v1`: el producto no tiene fila en la v1 (o no está en el registro). Respuesta:
  `alta-sin-v1:<CAS>` (molécula dada de alta por su CAS) o `excluir`.
* `tipo`: no es un conflicto que el script detecte, sino una decisión del usuario sobre el tipo de
  material (por ejemplo, que una «molécula» es en realidad una base). Respuesta: `base`; el
  material entra como base, con cobertura «desconocida» y sin origen.
* `origen` (D7): el origen de cada molécula que entra. La propuesta sale de
  `docs/v2/origenes-propuestos.csv` (por CAS, con su motivo y su fuente), y si no está ahí, de que
  el nombre o la página digan «natural»; si no, `desconocido`. Respuesta: `sintetico`,
  `aislado-natural` o `desconocido` (este último da un aviso en `validar:v2`).
"""
import csv
import re
from fractions import Fraction
from pathlib import Path

SHOP_SLUG = {"Maese Lab": "maeselab", "Olfatorium": "olfatorium", "Perfumiarz": "perfumiarz"}
SHOP_URL = {"Maese Lab": "https://maeselab.com/", "Olfatorium": "https://olfatorium.com/",
            "Perfumiarz": "https://perfumiarz.com/products/"}
CONFLICT_COLUMNS = ["producto", "tipo", "detalle", "recomendacion", "respuesta"]
PROPOSAL_COLUMNS = ["producto", "clave", "estado", "tipo", "material", "cas", "origen", "v1", "notas"]
NATURAL_WORDS = re.compile(r"\b(nat|natural)\b", re.IGNORECASE)
CAS_IN_TEXT = re.compile(r"\b(\d{2,7}-\d{2}-\d)\b")


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def v1_ids(glosario: str) -> list[str]:
    """The ids of the registry's «glosario» cell: «fig:924 Name [state] | fig:925 …»."""
    return [part.strip().split(" ")[0] for part in glosario.split(" | ") if part.strip()]


def plan(lot: str, spec: dict, root: Path, index: dict, known_products: set[str], known_cas: dict[str, str]):
    """The lot as an entry of alta.py, its proposal rows and its conflicts (with any answers)."""
    mine = read_csv(root / "docs" / "proveedores" / "mis-productos.csv")
    registry = {(r["producto"], r["tienda"]): r for r in read_csv(root / "docs" / "proveedores" / "registro.csv")}
    ifra_standards = {r["estandar"]: r for r in read_csv(root / "datos" / "ifra" / "51" / "estandares.csv")}
    v1 = read_csv(root / "datos" / "glosario" / "materiales.csv")
    v1_by_id = {r["id"]: r for r in v1}
    v1_by_cas: dict[str, list[dict[str, str]]] = {}
    for r in v1:
        for cas in [r["cas"], *r["otros_cas"].split()]:
            if cas:
                v1_by_cas.setdefault(cas, []).append(r)
    constituents: dict[str, list[dict[str, str]]] = {}
    for r in read_csv(root / "datos" / "glosario" / "material-constituyentes.csv"):
        constituents.setdefault(r["material"], []).append(r)
    proposed = {r["cas"]: r for r in read_csv(root / "docs" / "v2" / "origenes-propuestos.csv")}
    answers = {(r["producto"], r["tipo"]): r["respuesta"].strip()
               for r in read_csv(root / "datos" / "v2" / "respuestas" / f"{lot}.csv")}

    materials: list[dict] = []
    proposals: list[dict[str, str]] = []
    conflicts: list[dict[str, str]] = []

    for p in mine:
        if p["situacion"] != spec["situacion"] or p["tienda"] != spec["tienda"]:
            continue
        reg = registry.get((p["producto"], p["tienda"]))
        clase = reg["clase"] if reg else ""
        cas = (reg or {}).get("cas", "") or p["cas"]
        if not cas:
            m = CAS_IN_TEXT.search(p["notas"])
            cas = m.group(1) if m else ""
        candidates = [v1_by_id[i] for i in v1_ids((reg or {}).get("glosario", "")) if i in v1_by_id]
        if not candidates and cas:
            # Not in the registry (added after it was written): its v1 rows by the CAS of its notes.
            candidates = v1_by_cas.get(cas, [])
            if candidates:
                clase = "natural" if candidates[0]["clase"] == "natural" else candidates[0]["clase"]
        if clase and clase != spec["clase"] and clase != "sin fila en el glosario":
            continue
        name = p["producto"]
        key = f"{SHOP_SLUG.get(p['tienda'], slug(p['tienda']))}-{p['pagina'] or slug(name)}"
        if key in known_products:
            proposals.append({"producto": name, "clave": key, "estado": "ya-dado-de-alta"})
            continue

        found: list[dict[str, str]] = []

        def conflict(kind: str, detail: str, recommendation: str) -> None:
            found.append({"producto": name, "tipo": kind, "detalle": detail, "recomendacion": recommendation,
                          "respuesta": answers.get((name, kind), "")})

        if not candidates:
            where = "en el registro y sin fila en la v1" if reg else "sin fila en el registro ni en la v1"
            conflict("sin-fila-v1", f"{where}{f'; CAS {cas}' if cas else ''}; la clase no se sabe",
                     f"alta-sin-v1:{cas} si es molécula; excluir si no")
        row = candidates[0] if candidates else None
        if clase == "natural" and len({r["tipo_natural"] for r in candidates}) > 1:
            conflict("forma-natural", " | ".join(f"{r['id']} {r['tipo_natural'] or '(sin forma)'}" for r in candidates),
                     "decide el usuario la forma")

        same_cas = v1_by_cas.get(cas, []) if cas else []
        states = sorted({r["estado"] for r in same_cas})
        if len(states) > 1:
            conflict("estados-ifra", "; ".join(f"{r['id']} {r['estado']}" for r in same_cas[:6]),
                     f"v1:{row['id']}" if row else "decide el usuario")

        if row:
            in_index = sorted({s for s, _ in index.get(cas, [])})
            in_v1 = sorted(set(row["estandares"].split()))
            family = [c for c in row["condiciones"].split(" · ") if c.startswith("familia")]
            if in_v1 != in_index or family:
                detail = f"v1 {' '.join(in_v1) or '(ninguno)'}; índice {' '.join(in_index) or '(ninguno)'}"
                families = []
                for c in family:
                    m = re.search(r"\(STD (\d+)\)", c)
                    std = f"IFRA_STD_{m.group(1)}" if m else ""
                    if std in ifra_standards:
                        s = ifra_standards[std]
                        note = s["nota_especificacion"] or s["nota_restriccion"] or s["limite_expresado_como"]
                        families.append(std)
                        detail += f"; {c} → {std} «{s['nombre']}»: {note[:150]}"
                    else:
                        detail += f"; v1: {c}"
                if families and not ({*families} <= set(in_index)):
                    detail += " (el índice no lista su CAS: la familia le aplica por el nombre)"
                conflict("ifra-distinto", detail, "familia" if families else "indice")

            own_docs = {d for d in ((reg or {}).get(c, "") for c in ("certificado", "ficha", "alergenos")) if d}
            foreign = sorted({(c["aviso"].split(": ")[-1] if c["aviso"] else c["fuente"])
                              for c in constituents.get(row["id"], [])
                              if c["fuente"] in ("proveedor", "certificado")
                              and not any(d and d in c["aviso"] for d in own_docs)})
            if foreign:
                conflict("documento-ajeno", f"{row['id']}: " + " | ".join(foreign)[:160], "no-traer")

            sums: dict[str, Fraction] = {}
            for c in constituents.get(row["id"], []):
                try:
                    sums[c["variante"]] = sums.get(c["variante"], Fraction(0)) + Fraction(c["concentracion_pct"])
                except ValueError:
                    pass
            over = {v: s for v, s in sums.items() if s > Fraction(1005, 10)}
            if over:
                conflict("suma", "; ".join(f"{v} {float(s):.2f} %" for v, s in over.items()), "no-traer")

        excluded = any(c["respuesta"] == "excluir" for c in found)
        # D7: the origin of a molecule that enters. Not asked of what is out, or has no row yet.
        as_base = answers.get((name, "tipo")) == "base"
        if as_base:
            found.append({"producto": name, "tipo": "tipo", "detalle": "el usuario lo trata como base, no como molécula",
                          "recomendacion": "base", "respuesta": "base"})
        elif not excluded and not any(c["tipo"] == "sin-fila-v1" and not c["respuesta"] for c in found):
            if cas in proposed:
                guess, why = proposed[cas]["origen"], f"{proposed[cas]['motivo']} [{proposed[cas]['fuente']}]"
            elif NATURAL_WORDS.search(f"{name} {p['pagina']}"):
                guess, why = "aislado-natural", f"el nombre o la página dicen «natural» ({p['pagina'] or name})"
            else:
                guess, why = "desconocido", "sin indicio de si es natural o de síntesis"
            conflict("origen", why, guess)
        conflicts.extend(found)
        pending = [c for c in found if not c["respuesta"]]
        origin = next((c["respuesta"] for c in found if c["tipo"] == "origen"), "")
        why = next((c["detalle"] for c in found if c["tipo"] == "origen"), "")
        families_of = ([f for f in re.findall(r"IFRA_STD_\d+", next((c["detalle"] for c in found if c["tipo"] == "ifra-distinto"), ""))]
                       if any(c["tipo"] == "ifra-distinto" and c["respuesta"] == "familia" for c in found) else [])
        chosen = next((c["respuesta"][3:] for c in found if c["respuesta"].startswith("v1:")), None)
        if chosen:
            row = v1_by_id.get(chosen, row)
        if not cas:
            cas = next((c["respuesta"].split(":", 1)[1] for c in found if c["respuesta"].startswith("alta-sin-v1:")), "")
        state = "pendiente" if pending else "excluido" if excluded else "alta"
        proposals.append({
            "producto": name, "clave": key, "estado": state, "tipo": "sustancia",
            "material": row["nombre"] if row else name, "cas": cas, "origen": origin,
            "v1": row["id"] if row else "", "notas": f"Origen: {why}.",
        })
        if state != "alta":
            continue
        material_key = known_cas.get(cas) or f"sustancia-{cas}"
        product = {"clave": key, "nombre": name, "tienda": p["tienda"],
                   "url": (reg or {}).get("url") or (SHOP_URL.get(p["tienda"], "") + p["pagina"] if p["pagina"] else ""),
                   "fabricante": (reg or {}).get("fabricante", ""), "codigo": (reg or {}).get("codigo", ""),
                   "notas": p["notas"]}
        materials.append({
            "clave": material_key, "tipo": "base" if as_base else "sustancia", "nombre": row["nombre"] if row else name, "cas": cas,
            **({} if as_base else {"origen": origin, "origen_fuente": f"{why} (lote {lot}, confirmado por el usuario)."}),
            "v1": [row["id"]] if row else [], "productos": [product],
            **({"familias": sorted(set(families_of))} if families_of else {}),
        })

    # A lot enters whole, once every conflict has its answer: never half of it.
    if any(not c["respuesta"] for c in conflicts):
        materials = []
        for proposal in proposals:
            if proposal["estado"] == "alta":
                proposal["estado"] = "propuesta"
    entry = {"fecha": spec["fecha"], "documentos": [], "materiales": materials}
    return entry, proposals, conflicts


def write(path: Path, columns: list[str], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=columns, lineterminator="\n")
        writer.writeheader()
        for row in rows:
            writer.writerow({c: row.get(c, "") for c in columns})
