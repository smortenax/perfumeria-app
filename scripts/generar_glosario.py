#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Genera el glosario de materiales: el desplegable del buscador y sus regulaciones (P37).

Junta, por CAS:
- **las filas del FIG con las abreviaturas del usuario** (`datos/glosario/origen/`);
- **todo lo de IFRA** de una enmienda (`datos/ifra/<n>/`, de `importar_ifra.py`): los
  CAS de los estándares, los naturales del anexo y las bases de Schiff. Lo que IFRA tiene
  y el FIG no, entra como material nuevo, con una abreviatura generada.

Salen:
- `materiales.csv`: un material por fila, con su abreviatura, su estado frente a IFRA,
  sus condiciones y el límite de su estándar en cada categoría;
- `material-constituyentes.csv`: lo regulado que lleva cada material por dentro, con el
  natural del anexo de donde sale y cómo se emparejó.

Nada del laboratorio entra aquí (P37). Solo usa la biblioteca estándar.
Uso:  python scripts/generar_glosario.py [ENMIENDA]
"""
import csv
import hashlib
import json
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CODES = ROOT / "datos" / "glosario" / "origen" / "fig-materiales-codigos.csv"
OUT = ROOT / "datos" / "glosario"
CAS_RE = re.compile(r"\b\d{2,7}-\d{2}-\d\b")
CATEGORIES = ["1", "2", "3", "4", "5a", "5b", "5c", "5d", "6", "7a", "7b", "8", "9",
              "10a", "10b", "11a", "11b", "12"]
CAT_COLS = [f"cat_{c}" for c in CATEGORIES]

# Estado frente a IFRA, de más a menos restrictivo. Lo desconocido nunca se da por libre (§1.2).
ESTADOS = {
    "prohibido": "su estándar lo prohíbe como tal",
    "con-techo": "su estándar le pone un techo en % en alguna categoría",
    "condicion": "una especificación, una variante prohibida o una familia: no es un %",
    "por-constituyentes": "sin estándar propio, pero el anexo le da constituyentes regulados",
    "sin-dato": "natural sin estándar propio y fuera del anexo: sus constituyentes no se saben",
    "sin-estandar": "no está en el índice de IFRA, que es completo: sin estándar propio",
}

# The three standards that go by family, not by CAS. Matched by name, and said so.
FAMILIES = [
    ("IFRA_STD_089", "aceites cítricos: furocumarinas, bergapteno total",
     re.compile(r"\b(lemon|lime|bergamot|orange|grapefruit|mandarin|tangerine|citron|yuzu|"
                r"clementine|pomelo|kumquat|citrus)\b", re.I),
     re.compile(r"\b(flowers?|blossoms?|neroli|petitgrain|leaf|leaves)\b", re.I), True),
    ("IFRA_STD_184", "pináceas: índice de peróxidos",
     re.compile(r"\b(pine|pinus|fir|abies|spruce|picea|larch|larix|hemlock|tsuga|turpentine|"
                r"cedrus|pinene|carene)\b|\batlas\b.*\bcedar|\bcedar.*\batlas\b", re.I),
     None, False),
    ("IFRA_STD_188", "ésteres alílicos: alcohol alílico libre",
     re.compile(r"allyl.*\w+ate\b|\w+ate\b.*allyl", re.I), re.compile(r"isothiocyanate", re.I), False),
]

TYPE_WORDS = {"oil", "absolute", "extract", "concrete", "resinoid", "tincture", "distillate",
              "terpenes", "oleoresin", "essence", "gum", "balsam", "resin", "co2", "rectified",
              "expressed", "distilled", "folded", "terpeneless", "washed", "fractions", "fraction"}
TYPE_LETTER = {"oil": "O", "absolute": "A", "extract": "E", "concrete": "C", "resinoid": "R",
               "tincture": "T", "distillate": "D", "terpenes": "Te", "oleoresin": "Or",
               "gum": "G", "balsam": "B", "resin": "Rs"}
GREEK = {"alpha": "α", "beta": "β", "gamma": "γ", "delta": "δ", "epsilon": "ε", "eta": "η"}
SKIP = {"cis", "trans", "tert", "sec", "dl", "and", "of", "the", "with", "from", "in", "ext",
        "or", "for", "mixed", "isomers", "unspecified", "isomer", *GREEK}

# ISO 9235 processing numbers of the annex, in the words of the user's «tipo».
ISO_TYPE = {"2.1": "absolute", "2.4": "balsam", "2.5": "oil", "2.6": "oil", "2.7": "concrete",
            "2.8": "distillate", "2.12": "oil", "2.13": "extract", "2.15": "gum",
            "2.16": "oleoresin", "2.21": "oleoresin", "2.25": "resin", "2.26": "resinoid",
            "2.27": "extract", "2.28": "oil", "2.29": "oil", "2.30": "terpenes",
            "2.31": "tincture", "2.32": "oil", "2.33": "oil", "2.24": "oil"}


def norm(text: str) -> str:
    text = unicodedata.normalize("NFD", text).encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", text.lower().replace("*", ""))).strip()


def read(path: Path) -> list[dict]:
    with path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def write(path: Path, header: list[str], rows: list[dict]) -> None:
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=header, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    print(f"{path.relative_to(ROOT).as_posix()}: {len(rows)} filas")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def pct(text: str) -> str:
    return text.replace(".", ",") + " %"


def short(key: str) -> str:
    return "STD " + key.rsplit("_", 1)[-1]


def make_code(name: str, kind: str, taken: set[str]) -> str:
    """A provisional code in the style of the user's: an isomer letter, the initials of
    the name, and the letter of the kind of natural. Never one that already exists."""
    raw = [w for w in re.split(r"[^A-Za-z]+", unicodedata.normalize("NFD", name)
                               .encode("ascii", "ignore").decode()) if w]
    greek = next((GREEK[w.lower()] for w in raw if w.lower() in GREEK), "")
    words = [w for w in raw if len(w) >= 2 and not w.isdigit() and w.lower() not in SKIP
             and not (kind and w.lower() in TYPE_WORDS)]
    words = words or [w for w in raw if w.isalpha()] or ["X"]
    suffix = TYPE_LETTER.get(kind, "")
    first = words[0]
    stems = []
    if len(words) >= 2:
        stems.append(first[0].upper() + words[1][0].upper())
    stems.append(first[0].upper() + first[1:2].lower())
    if len(words) >= 2:
        stems.append(first[0].upper() + first[1:2].lower() + words[1][0].upper())
    if len(words) >= 3:
        stems.append("".join(w[0].upper() for w in words[:3]))
    stems.append(first[0].upper() + first[1:3].lower())
    stems.append(first[0].upper() + first[1:4].lower())
    for stem in stems:
        code = greek + stem + suffix
        if code not in taken:
            return code
    for i in range(2, 1000):
        code = greek + stems[0] + suffix + str(i)
        if code not in taken:
            return code
    raise ValueError(name)


def combine(cells: list[str]) -> str:
    """Several standards on one material: per category, the strictest."""
    numbers = [c for c in cells if re.fullmatch(r"[\d.]+", c)]
    if "prohibido" in cells:
        return "prohibido"
    if numbers:
        return min(numbers, key=float)
    for word in ("ver-nota", "sin-restriccion"):
        if word in cells:
            return word
    return ""


def main() -> None:
    n = sys.argv[1] if len(sys.argv) > 1 else "51"
    ifra = ROOT / "datos" / "ifra" / n
    standards = {r["estandar"]: r for r in read(ifra / "estandares.csv")}
    std_cas = read(ifra / "estandar-cas.csv")
    naturals = read(ifra / "naturales.csv")
    schiff = read(ifra / "bases-schiff.csv")
    codes = read(CODES)

    stds_of_cas: dict[str, list[str]] = {}
    groups_of_cas: dict[str, list[str]] = {}
    synonyms_of_cas: dict[str, list[str]] = {}
    cas_of_std: dict[str, list[str]] = {}
    for r in std_cas:
        stds_of_cas.setdefault(r["cas"], [])
        if r["estandar"] not in stds_of_cas[r["cas"]]:
            stds_of_cas[r["cas"]].append(r["estandar"])
        cas_of_std.setdefault(r["estandar"], []).append(r["cas"])
        if r["grupo"] and r["grupo"] != "e.g.":
            groups_of_cas.setdefault(r["cas"], []).append(f"{r['grupo']} ({short(r['estandar'])})")
        if r["sinonimos"]:
            synonyms_of_cas.setdefault(r["cas"], []).extend(r["sinonimos"].split(" | "))

    # The annex, as variants of naturals.
    variants: dict[str, dict] = {}
    for r in naturals:
        v = variants.setdefault(r["nombre"], {
            "nombre": r["nombre"], "principal": r["cas_principal"].split(),
            "otros": r["otros_cas"].split(), "iso": r["categoria_iso"],
            "rifm": r["rifm_id"], "botanico": r["nombre_botanico"], "filas": []})
        v["filas"].append(r)
    ncs_principal = {c for v in variants.values() for c in v["principal"]}

    materials: list[dict] = []
    taken = {r["Codigo"] for r in codes}

    def base(**kw) -> dict:
        row = {"id": "", "codigo": "", "codigo_origen": "", "nombre": "", "cas": "", "otros_cas": "",
               "clase": "", "tipo_natural": "", "isomero": "", "descriptor_1": "", "descriptor_2": "",
               "descriptor_3": "", "actualizado_fig": "", "fuentes": "", "estandares": "",
               "nombre_ifra": "", "estado": "", "condiciones": "", "constituyentes": "",
               "coincidencia_anexo": "", **{c: "" for c in CAT_COLS}, "limite_nota": "",
               "sinonimos": ""}
        row.update(kw)
        return row

    # 1. The rows of the FIG, with the user's codes.
    for i, r in enumerate(codes, 1):
        name = r["Nombre"].strip()
        updated = name.endswith("*")
        name = name.rstrip("* ").strip()
        cas = r["CAS"].strip()
        natural = bool(r["Tipo"]) or cas in ncs_principal
        materials.append(base(
            id=f"fig:{i}", codigo=r["Codigo"], codigo_origen="usuario", nombre=name, cas=cas,
            clase="natural" if natural else "molécula", tipo_natural=r["Tipo"], isomero=r["Isomero"],
            descriptor_1=r["Descriptor_1"], descriptor_2=r["Descriptor_2"],
            descriptor_3=r["Descriptor_3"], actualizado_fig="sí" if updated else "", fuentes="fig"))
    fig_cas = {m["cas"] for m in materials}
    by_norm_name: dict[str, list[dict]] = {}
    for m in materials:
        by_norm_name.setdefault(norm(m["nombre"]), []).append(m)

    # 2. The CAS of the standards that the FIG does not have.
    new: list[dict] = []
    for cas, keys in stds_of_cas.items():
        if cas in fig_cas:
            continue
        std = standards[keys[0]]
        own = synonyms_of_cas.get(cas, [])
        # Several CAS under one standard: the plainest of its own synonyms («Safrole»).
        plain = [x.replace("(commercial name)", "").strip() for x in own if not re.search(r"[\d,\[\]]", x)]
        if len(cas_of_std[keys[0]]) == 1 or not own:
            name = std["nombre"]
        else:
            name = min(plain, key=len) if plain else own[0]
        natural = cas in ncs_principal or bool(re.search(r"\b(oil|absolute|extract|resinoid|balsam|gum)\b", name, re.I))
        kind = next((w for w in ("absolute", "extract", "resinoid", "balsam", "gum", "oil")
                     if re.search(rf"\b{w}\b", name, re.I)), "") if natural else ""
        new.append(base(id=f"cas:{cas}", nombre=name, cas=cas, clase="natural" if natural else "molécula",
                        tipo_natural=kind, fuentes="ifra-estandar"))

    # 3. The naturals of the annex: to their row of the FIG by name, or new.
    links: list[tuple[dict, dict, str]] = []  # (material, variant, how)
    named: set[str] = set()
    ids = {m["id"] for m in materials} | {m["id"] for m in new}
    for v in variants.values():
        cas_set = set(v["principal"]) | set(v["otros"])
        candidates = [m for m in by_norm_name.get(norm(v["nombre"]), [])]
        same_cas = [m for m in candidates if m["cas"] in cas_set]
        target = (same_cas or candidates or [None])[0]
        if target is None:
            slug = norm(v["nombre"]).replace(" ", "-")
            mid = f"ncs:{slug}"
            k = 2
            while mid in ids:
                mid, k = f"ncs:{slug}-{k}", k + 1
            ids.add(mid)
            proc = re.sub(r"^[A-Z]", "", v["iso"])
            kind = ISO_TYPE.get(proc, ISO_TYPE.get(".".join(proc.split(".")[:2]), ""))
            target = base(id=mid, nombre=v["nombre"], cas=(v["principal"] or [""])[0],
                          otros_cas=" ".join(v["principal"][1:] + v["otros"]), clase="natural",
                          tipo_natural=kind, fuentes="ifra-anexo")
            new.append(target)
        else:
            if "ifra-anexo" not in target["fuentes"]:
                target["fuentes"] += " ifra-anexo"
            target["clase"] = "natural"
        links.append((target, v, "nombre"))
        named.add(target["id"])

    # A row of the FIG that is a natural of the annex by its CAS, but not by name, may be
    # any of the variants under that CAS: all of them, and the worst one counts.
    variants_of_cas: dict[str, list[dict]] = {}
    for v in variants.values():
        for c in v["principal"]:
            variants_of_cas.setdefault(c, []).append(v)
    for m in materials:
        if m["id"] in named or m["cas"] not in variants_of_cas:
            continue
        m["clase"] = "natural"
        if "ifra-anexo" not in m["fuentes"]:
            m["fuentes"] += " ifra-anexo"
        for v in variants_of_cas[m["cas"]]:
            links.append((m, v, "cas"))

    everything = materials + new
    by_id = {m["id"]: m for m in everything}

    # 4. Schiff bases: they carry their aldehyde.
    schiff_links: list[tuple[dict, dict]] = []
    for r in schiff:
        for cas in r["cas_base_schiff"].split():
            targets = [m for m in everything if m["cas"] == cas]
            if not targets:
                t = base(id=f"cas:{cas}", nombre=r["base_schiff"].split(";")[0].strip(), cas=cas,
                         clase="molécula", fuentes="ifra-schiff")
                everything.append(t)
                by_id[t["id"]] = t
                targets = [t]
            for t in targets:
                if "ifra-schiff" not in t["fuentes"]:
                    t["fuentes"] += " ifra-schiff"
                schiff_links.append((t, r))

    # 5. Codes for everything new, in a stable order.
    for m in sorted((m for m in everything if not m["codigo"]), key=lambda m: m["id"]):
        m["codigo"] = make_code(m["nombre"], m["tipo_natural"], taken)
        m["codigo_origen"] = "generado"
        taken.add(m["codigo"])

    # 6. Constituents.
    constituents: list[dict] = []
    per_material: dict[str, list[dict]] = {}
    for m, v, how in links:
        for r in v["filas"]:
            row = {"material": m["id"], "codigo": m["codigo"], "variante": v["nombre"],
                   "coincidencia": how, "cas_constituyente": r["cas_constituyente"],
                   "constituyente": r["constituyente"], "estandar": r["estandar_constituyente"],
                   "concentracion_pct": r["concentracion_pct"], "fuente": "anexo", "aviso": r["aviso"]}
            constituents.append(row)
            per_material.setdefault(m["id"], []).append(row)
    for m, r in schiff_links:
        row = {"material": m["id"], "codigo": m["codigo"], "variante": r["base_schiff"],
               "coincidencia": "cas", "cas_constituyente": r["cas_aldehido"], "constituyente": r["aldehido"],
               "estandar": r["estandar_aldehido"], "concentracion_pct": r["nivel_aldehido_pct"],
               "fuente": "bases-schiff", "aviso": ""}
        constituents.append(row)
        per_material.setdefault(m["id"], []).append(row)

    # 7. Standards, state and conditions of every material.
    as_such = re.compile(r"^(This material should not be used|.{0,120}\bas such should not be used)", re.I)
    for m in everything:
        cas_all = [m["cas"]] + (m["otros_cas"].split() if m["id"].startswith("cas:") else [])
        keys = []
        for c in cas_all:
            keys += [k for k in stds_of_cas.get(c, []) if k not in keys]
        conditions: list[str] = []
        if m["id"].startswith("ncs:"):
            others = sorted({k for c in m["otros_cas"].split() for k in stds_of_cas.get(c, [])} - set(keys))
            conditions += [f"otro CAS suyo está en «{standards[k]['nombre']}» ({short(k)}): comprobar"
                           for k in others]
        stds = [standards[k] for k in keys]
        m["estandares"] = " ".join(keys)
        m["nombre_ifra"] = " | ".join(s["nombre"] for s in stds)
        if "ifra-estandar" not in m["fuentes"] and keys:
            m["fuentes"] += " ifra-estandar"
        for c in CAT_COLS:
            m[c] = combine([s[c] for s in stds])
        m["limite_nota"] = min((s["limite_nota"] for s in stds if s["limite_nota"]), key=float, default="")
        syn = list(synonyms_of_cas.get(m["cas"], []))
        if len(stds) == 1 and len(cas_of_std[keys[0]]) == 1:
            syn += [x for x in stds[0]["sinonimos"].split(" | ") if x and x not in syn]
        m["sinonimos"] = " | ".join(syn)

        prohibited = any(s["tipo"] == "PROHIBITION" or (s["prohibicion"] and as_such.search(s["nota_prohibicion"]))
                         for s in stds)
        # A standard in groups (Tagetes, Savin): the CAS only under «Prohibition of…», or a
        # material named as the prohibited one, is prohibited.
        for s in stds:
            heads = [g for g in groups_of_cas.get(m["cas"], []) if g.endswith(f"({short(s['estandar'])})")]
            banned = [re.sub(r"^Prohibition of\s+|\s*\(STD \d+\)$", "", g) for g in heads if g.startswith("Prohibition of")]
            if banned and (len(banned) == len(heads) or any(norm(b) in norm(m["nombre"]) for b in banned)):
                prohibited = True
        numeric = any(re.fullmatch(r"[\d.]+", m[c]) or m[c] == "prohibido" for c in CAT_COLS)
        for s in stds:
            k = short(s["estandar"])
            if s["especificacion"]:
                conditions.append(f"especificación ({k})")
            by_category = any(s[c] == "prohibido" for c in CAT_COLS)
            if s["prohibicion"] and not (s["tipo"] == "PROHIBITION" or as_such.search(s["nota_prohibicion"])) and not by_category:
                conditions.append(f"una variante está prohibida ({k})")
            if s["limite_nota"]:
                conditions.append(f"lo que llega de naturales, hasta {pct(s['limite_nota'])} ({k})")
            if s["limite_expresado_como"]:
                conditions.append(f"el límite se cuenta como {s['limite_expresado_como']} ({k})")
        conditions += [f"grupo del estándar: {g}" for g in groups_of_cas.get(m["cas"], [])]
        if m["clase"] == "natural":
            for s in stds:
                a, b = norm(s["nombre"]), norm(m["nombre"])
                if a not in b and b not in a:
                    conditions.append(f"mismo CAS que «{s['nombre']}» ({short(s['estandar'])}): comprobar la variante")
        for key, text, include, exclude, natural_only in FAMILIES:
            if key in keys or (natural_only and m["clase"] != "natural"):
                continue
            if include.search(m["nombre"]) and not (exclude and exclude.search(m["nombre"])):
                conditions.append(f"familia, por el nombre: {text} ({short(key)})")

        rows = per_material.get(m["id"], [])
        hows = {r["coincidencia"] for r in rows if r["fuente"] == "anexo"}
        n_var = len({r["variante"] for r in rows if r["fuente"] == "anexo"})
        if hows == {"cas"}:
            m["coincidencia_anexo"] = f"por CAS: {n_var} variantes, cuenta la peor" if n_var > 1 else "por CAS"
            if n_var > 1:
                conditions.append(f"variante sin concretar: cuenta la peor de {n_var} del anexo")
        elif hows:
            m["coincidencia_anexo"] = "por nombre"
        m["constituyentes"] = str(len({r["estandar"] or r["constituyente"] for r in rows})) if rows else ""
        if any(not r["estandar"] for r in rows):
            conditions.append("un constituyente del anexo no está en el índice: sin techo que aplicar")
        if m["clase"] == "natural" and not rows and stds:
            conditions.append("constituyentes: sin dato en el anexo")

        if prohibited:
            m["estado"] = "prohibido"
        elif numeric:
            m["estado"] = "con-techo"
        elif stds:
            m["estado"] = "condicion"
        elif rows:
            m["estado"] = "por-constituyentes"
        elif m["clase"] == "natural":
            m["estado"] = "sin-dato"
        elif any(c.startswith("familia") for c in conditions):
            m["estado"] = "condicion"
        else:
            m["estado"] = "sin-estandar"
        m["condiciones"] = " · ".join(dict.fromkeys(conditions))
        m["fuentes"] = " ".join(dict.fromkeys(m["fuentes"].split()))

    OUT.mkdir(parents=True, exist_ok=True)
    header = list(base().keys())
    ordered = materials + sorted((m for m in everything if not m["id"].startswith("fig:")), key=lambda m: norm(m["nombre"]))
    write(OUT / "materiales.csv", header, ordered)
    write(OUT / "material-constituyentes.csv",
          ["material", "codigo", "variante", "coincidencia", "cas_constituyente", "constituyente",
           "estandar", "concentracion_pct", "fuente", "aviso"], constituents)

    counts = {
        "materiales": len(ordered),
        "del_fig": len(materials),
        "solo_de_ifra": len(ordered) - len(materials),
        "codigos_del_usuario": sum(1 for m in ordered if m["codigo_origen"] == "usuario"),
        "codigos_generados": sum(1 for m in ordered if m["codigo_origen"] == "generado"),
        "por_estado": {e: sum(1 for m in ordered if m["estado"] == e) for e in ESTADOS},
        "filas_de_constituyentes": len(constituents),
    }
    provenance = {
        "enmienda_ifra": n,
        "estados": ESTADOS,
        "fig": "Information derived from the IFRA Fragrance Ingredient Glossary, developed by The International Fragrance Association",
        "origenes": {
            CODES.relative_to(ROOT).as_posix(): {"sha256": sha256(CODES), "que_es": "filas del FIG con las abreviaturas del usuario, iteración no final"},
            **{f"datos/ifra/{n}/{p}": {"sha256": sha256(ifra / p)} for p in
               ("estandares.csv", "estandar-cas.csv", "naturales.csv", "bases-schiff.csv")},
        },
        "generado": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "cuentas": counts,
    }
    (OUT / "procedencia.json").write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + "\n",
                                          encoding="utf-8", newline="\n")
    print(json.dumps(counts, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
