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
* `documento-otro-material` y `documento-otro-proveedor`: lo que antes era `documento-ajeno`, separado
  por el criterio del usuario (2026-10-03). Un documento de otro material se descarta y se apunta en
  `docs/v2/errores-v1.md`. Uno de otro proveedor (el mismo material) se trae como placeholder con
  autoridad «literatura», contando su máximo (D2), si el documento está revisado: la clasificación y
  la revisión salen de `docs/v2/documentos-ajenos.csv`, y las cifras las lee `documentos.py`.
  Respuesta: `traer` o `no-traer` (`descartar` en el de otro material). Los lotes anteriores, cuyas
  respuestas están en `documento-ajeno`, no se reabren: ese tipo sigue valiendo para ellos.
* `forma` (solo naturales, D1): la especie, parte, proceso y quimiotipo de cada natural. La
  propuesta sale de `docs/v2/formas-propuestas.csv`, y la evidencia, del título y la descripción
  de su página de la tienda (`datos/v2/paginas-tienda.csv`, de `pagina_tienda.py`) y de lo que ya
  se sabe. Respuesta: `especie|parte|proceso|quimiotipo` (el quimiotipo puede ir vacío) o
  `confirmar`, que acepta la propuesta tal cual.
* `v1-correspondencia` (solo naturales con varias filas de forma en la v1): cuál es la suya.
  Respuesta: `v1:<id>`.
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
import sys
from fractions import Fraction
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import documentos  # noqa: E402

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


def name_in(name: str, spec: dict) -> bool:
    """A product the lot names on purpose (`ademas`), whatever its class in the registry."""
    return name in spec.get("ademas", [])


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def v1_ids(glosario: str) -> list[str]:
    """The ids of the registry's «glosario» cell: «fig:924 Name [state] | fig:925 …»."""
    return [part.strip().split(" ")[0] for part in glosario.split(" | ") if part.strip()]


def pages_of(spec: dict, root: Path) -> list[tuple[str, str]]:
    """The (shop, page) of the products a lot selects, for their evidence (pagina_tienda.py)."""
    registry = {(r["producto"], r["tienda"]): r for r in read_csv(root / "docs" / "proveedores" / "registro.csv")}
    pages = []
    for p in read_csv(root / "docs" / "proveedores" / "mis-productos.csv"):
        if p["situacion"] != spec["situacion"] or p["tienda"] != spec["tienda"]:
            continue
        clase = (registry.get((p["producto"], p["tienda"])) or {}).get("clase", "")
        if clase == spec["clase"] or p["producto"] in spec.get("ademas", []):
            page = p["pagina"] or slug(p["producto"])
            cached = root / "datos" / "glosario" / ".cache" / "proveedores" / SHOP_SLUG.get(p["tienda"], "") / "paginas" / f"{page}.html"
            if p["pagina"] or cached.exists():
                pages.append((p["tienda"], page))
    return pages


def plan(lot: str, spec: dict, root: Path, index: dict, known_products: set[str], known_cas: dict[str, str],
         known_names: set[str] = frozenset()):
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
    shapes = {r["producto"]: r for r in read_csv(root / "docs" / "v2" / "formas-propuestas.csv")}
    foreign_docs: dict[str, list[dict[str, str]]] = {}
    for r in read_csv(root / "docs" / "v2" / "documentos-ajenos.csv"):
        foreign_docs.setdefault(r["producto"], []).append(r)
    pages = {(r["tienda"], r["pagina"]): r for r in read_csv(root / "datos" / "v2" / "paginas-tienda.csv")}
    natural_lot = spec["clase"] == "natural"
    answers = {(r["producto"], r["tipo"]): r["respuesta"].strip()
               for r in read_csv(root / "datos" / "v2" / "respuestas" / f"{lot}.csv")}

    materials: list[dict] = []
    lot_documents: list[dict[str, str]] = []
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
        shape = shapes.get(p["producto"]) if natural_lot else None
        # A CAS the user's own notes give as «por confirmar» finds the v1 rows, but is not written as data.
        lookup_cas = cas or (shape or {}).get("cas_busqueda", "")
        candidates = [v1_by_id[i] for i in v1_ids((reg or {}).get("glosario", "")) if i in v1_by_id]
        if not candidates and lookup_cas:
            # Not in the registry (added after it was written): its v1 rows by the CAS of its notes.
            candidates = v1_by_cas.get(lookup_cas, [])
            if candidates:
                clase = "natural" if candidates[0]["clase"] == "natural" else candidates[0]["clase"]
        if natural_lot and lookup_cas:
            # The registry lists only some forms; the user chooses among all the rows of the CAS.
            candidates = candidates + [r for r in v1_by_cas.get(lookup_cas, []) if r not in candidates]
        # The row of the glossary that the proposal names, even if its CAS is not the one of the product's notes
        # (the tinctures of the ambergris and of the tonka bean have rows of their own in the glossary).
        if shape and shape["v1_id"] in v1_by_id and v1_by_id[shape["v1_id"]] not in candidates:
            candidates = [v1_by_id[shape["v1_id"]]] + candidates
        extra = name_in(p["producto"], spec)
        if clase and clase != spec["clase"] and clase != "sin fila en el glosario" and not extra:
            continue
        name = p["producto"]
        key = f"{SHOP_SLUG.get(p['tienda'], slug(p['tienda']))}-{p['pagina'] or slug(name)}"
        if key in known_products or (natural_lot and name in known_names):
            proposals.append({"producto": name, "clave": key, "estado": "ya-dado-de-alta"})
            continue

        found: list[dict[str, str]] = []
        fam_standards: list[str] = []

        def conflict(kind: str, detail: str, recommendation: str) -> None:
            # The old «documento-ajeno» answers of the lots already closed still count for the two new kinds.
            answer = answers.get((name, kind), "") or (
                answers.get((name, "documento-ajeno"), "") if kind.startswith("documento-otro") else "")
            found.append({"producto": name, "tipo": kind, "detalle": detail, "recomendacion": recommendation,
                          "respuesta": answer})

        # A base or specialty has no CAS and no row in the glossary by nature: it is not a missing row.
        base_class = clase == "base o especialidad" and not shape
        if not candidates and not base_class:
            where = "en el registro y sin fila en la v1" if reg else "sin fila en el registro ni en la v1"
            conflict("sin-fila-v1", f"{where}{f'; CAS {cas}' if cas else ''}; la clase no se sabe",
                     (f"alta-sin-v1:{cas}" if cas else "excluir") if natural_lot else f"alta-sin-v1:{cas} si es molécula; excluir si no")
        # For a natural, its v1 row is the one of the form proposed; the user confirms it when there are several.
        best = next((r for r in candidates if shape and shape["v1_id"] and r["id"] == shape["v1_id"]), None) or next(
            (r for r in candidates if shape and r["tipo_natural"] == shape["v1_tipo"]), None)
        # A natural whose form the glossary does not have (an extract, when it has the oil) is not matched to another.
        no_match = natural_lot and shape and not shape["v1_id"] and not shape["v1_tipo"]
        row = best or (None if no_match else candidates[0] if candidates else None)
        if natural_lot and shape and no_match and candidates:
            conflict("v1-correspondencia",
                     "ninguna fila tiene su forma: " + " | ".join(f"{r['id']} {r['nombre']} [{r['tipo_natural'] or 'sin forma'}]" for r in candidates[:4]),
                     "ninguna")
        elif natural_lot and len(candidates) > 1:
            ordered = ([best] if best else []) + [r for r in candidates if r is not best]
            conflict("v1-correspondencia",
                     " | ".join(f"{r['id']} {r['nombre']} [{r['tipo_natural'] or 'sin forma'}, {r['estado']}]" for r in ordered[:6])
                     + (f" | … {len(ordered) - 6} más" if len(ordered) > 6 else ""),
                     f"v1:{row['id']}")

        same_cas = v1_by_cas.get(lookup_cas, []) if lookup_cas else []
        states = sorted({r["estado"] for r in same_cas})
        if len(states) > 1 and not natural_lot:
            conflict("estados-ifra", "; ".join(f"{r['id']} {r['estado']}" for r in same_cas[:6]),
                     f"v1:{row['id']}" if row else "decide el usuario")

        if row:
            in_index = sorted({s for s, _ in index.get(lookup_cas, [])})
            in_v1 = sorted(set(row["estandares"].split()))
            family = [c for c in row["condiciones"].split(" · ") if c.startswith("familia")]
            if in_v1 != in_index or family:
                detail = f"v1 {' '.join(in_v1) or '(ninguno)'}; índice {' '.join(in_index) or '(ninguno)'}"
                families = []
                fam_standards.clear()
                for c in family:
                    m = re.search(r"\(STD (\d+)\)", c)
                    std = f"IFRA_STD_{m.group(1)}" if m else ""
                    if std in ifra_standards:
                        s = ifra_standards[std]
                        note = s["nota_especificacion"] or s["nota_restriccion"] or s["limite_expresado_como"]
                        families.append(std)
                        fam_standards.append(std)
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
            classified = foreign_docs.get(name, [])
            if classified:
                for kind, wanted in (("documento-otro-proveedor", "otro-proveedor"), ("documento-otro-material", "otro-material")):
                    docs = [d for d in classified if d["clasificacion"] == wanted]
                    if not docs:
                        continue
                    detail = " | ".join(
                        f"{d['ref']} {d['emisor']}: {d['titulo']} [{'revisado' if d['revisado'] == 'si' else 'sin revisar'}]"
                        for d in docs)
                    if wanted == "otro-proveedor":
                        conflict(kind, detail, "traer" if any(d["revisado"] == "si" for d in docs) else "no-traer")
                    else:
                        conflict(kind, detail + " → se apunta en errores-v1.md", "descartar")
            elif foreign:
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
        if natural_lot and not shape and not excluded and not any(c["tipo"] == "sin-fila-v1" and not c["respuesta"] for c in found):
            conflict("tipo", f"«{clase or 'sin clase'}» en el registro y sin forma botánica propuesta: ¿es una base?", "base")
            as_base = any(c["tipo"] == "tipo" and c["respuesta"] == "base" for c in found)
        if natural_lot and shape and not excluded:
            page = pages.get((p["tienda"], p["pagina"] or slug(name)), {})
            if page:
                evidence = f"página [{page.get('fuente', '?')}]: «{page.get('titulo', '')}»" + (
                    f" — {page['descripcion']}" if page.get("descripcion") else " — (sin descripción)")
            else:
                evidence = "sin página en la tienda"
            proposal = "|".join([shape["especie"], shape["parte"], shape["proceso"], shape["quimiotipo"]])
            annex = f"; anexo IFRA: «{shape['anexo']}»" if shape["anexo"] else "; sin anexo IFRA (constituyentes desconocidos)"
            conflict("forma", f"{evidence} || propongo {proposal.replace('|', ' / ')}: {shape['motivo']} [{shape['fuente']}]{annex}", proposal)
        if as_base and not natural_lot:
            found.append({"producto": name, "tipo": "tipo", "detalle": "el usuario lo trata como base, no como molécula",
                          "recomendacion": "base", "respuesta": "base"})
        elif not natural_lot and not excluded and not any(c["tipo"] == "sin-fila-v1" and not c["respuesta"] for c in found):
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
        families_of = list(fam_standards) if any(c["tipo"] == "ifra-distinto" and c["respuesta"] == "familia" for c in found) else []
        form_answer = next((c["respuesta"] for c in found if c["tipo"] == "forma"), "")
        if form_answer == "confirmar":
            form_answer = next((c["recomendacion"] for c in found if c["tipo"] == "forma"), "")
        form = (form_answer.split("|") + ["", "", "", ""])[:4] if form_answer else None
        chosen = next((c["respuesta"][3:] for c in found if c["respuesta"].startswith("v1:")), None)
        if chosen:
            row = v1_by_id.get(chosen, row)
        if not cas:
            cas = next((c["respuesta"].split(":", 1)[1] for c in found if c["respuesta"].startswith("alta-sin-v1:")), "")
        state = "pendiente" if pending else "excluido" if excluded else "alta"
        proposals.append({
            "producto": name, "clave": key, "estado": state, "tipo": "base" if as_base else "natural" if natural_lot else "sustancia",
            "material": (shape["nombre"] if natural_lot and shape else row["nombre"] if row else name), "cas": cas,
            "origen": origin, "v1": row["id"] if row else "",
            "notas": (f"Forma: {' / '.join(form)}." if form else "Forma: por confirmar.") if natural_lot else f"Origen: {why}.",
        })
        if state != "alta":
            continue
        if natural_lot:
            # D1: a natural is its species + part + process + chemotype.
            material_key = "natural-" + "-".join(slug(x) for x in form if x) if form else f"natural-{slug(name)}"
        else:
            material_key = known_cas.get(cas) or f"sustancia-{cas}"
        product = {"clave": key, "nombre": name, "tienda": p["tienda"],
                   "url": (reg or {}).get("url") or (SHOP_URL.get(p["tienda"], "") + p["pagina"] if p["pagina"] else ""),
                   "fabricante": (reg or {}).get("fabricante", ""), "codigo": (reg or {}).get("codigo", ""),
                   "notas": p["notas"]}
        brought = []
        if any(c["tipo"] == "documento-otro-proveedor" and c["respuesta"] == "traer" for c in found):
            brought = [d for d in foreign_docs.get(name, []) if d["clasificacion"] == "otro-proveedor" and d["revisado"] == "si"]
        if as_base:
            extras = {}
        elif natural_lot and shape and form:
            extras = {"especie": form[0], "parte": form[1], "proceso": form[2], "quimiotipo": form[3],
                      "notas": f"Forma confirmada por el usuario (lote {lot}); {shape['motivo']}."}
            if shape["anexo"]:
                extras["anexo"] = {"documento": "ifra51-anexo-naturales", "nombre": shape["anexo"], "cas": cas or lookup_cas}
        elif natural_lot:
            extras = {}
        else:
            extras = {"origen": origin, "origen_fuente": f"{why} (lote {lot}, confirmado por el usuario)."}
        if brought:
            literature = []
            for d in brought:
                table = [(cas, nm, val, kind) for cas, nm, val, kind in documentos.filas(d["lector"], d["ref"], d["ruta"], root)
                         if cas in index]
                literature.append({"documento": f"doc-{d['ref'].lower()}", "cobertura": d["cobertura"], "filas": table,
                                   "notas": "cifras de un documento de otro proveedor: placeholder de literatura, cuenta su máximo (D2); "
                                            "no prueba que este lote no lleve más"})
                lot_documents.append({"clave": f"doc-{d['ref'].lower()}", "tipo": d["tipo"], "titulo": d["titulo"],
                                      "emisor": d["emisor"], "fecha": d["fecha"], "ruta": d["ruta"],
                                      "estado_revision": "revisado", "notas": d["motivo"]})
            extras = {**extras, "literatura": literature}
        materials.append({
            "clave": material_key, "tipo": "base" if as_base else "natural" if natural_lot else "sustancia",
            "nombre": (shape["nombre"] if natural_lot and shape else row["nombre"] if row else name), "cas": cas,
            **extras,
            "v1": [row["id"]] if row else [], "productos": [product],
            **({"familias": sorted(set(families_of))} if families_of else {}),
        })

    # A lot enters whole, once every conflict has its answer: never half of it.
    if any(not c["respuesta"] for c in conflicts):
        materials = []
        for proposal in proposals:
            if proposal["estado"] == "alta":
                proposal["estado"] = "propuesta"
    if not materials:
        lot_documents = []
    entry = {"fecha": spec["fecha"], "documentos": lot_documents, "materiales": materials}
    return entry, proposals, conflicts


def write(path: Path, columns: list[str], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=columns, lineterminator="\n")
        writer.writeheader()
        for row in rows:
            writer.writerow({c: row.get(c, "") for c in columns})
