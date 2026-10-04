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

# What is decided by name is not a conflict: it enters with the standard and the decision noted (D15).
DECIDED = {"estandar-decidido": "decidido por el usuario", "estandar-por-evidencia": "la evidencia dice que es la misma sustancia",
           "estandar-de-clase": "D16: la definición de su clase"}

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
        self.annex_by_cas: dict[str, dict[str, list[dict[str, str]]]] = defaultdict(lambda: defaultdict(list))
        for a in read_csv(IFRA / "naturales.csv"):
            for c in [a["cas_principal"], *a["otros_cas"].split()]:
                self.annex_by_cas[c][a["nombre"]].append(a)
        self.later = {r["id_v1"] for r in read_csv(DOCS / "glosario-despues.csv")}
        # What the v2 had before the glossary lots: the materials these lots made (key «glosario-…») are not «what was there».
        made_here = {r["id"] for r in read_csv(V2 / "registro-ids.csv") if r["entidad"] == "material" and r["clave"].startswith("glosario-")}
        self.materials = [m for m in read_csv(V2 / "materiales.csv") if m["id"] not in made_here]
        self.linked = {r["id_v1"] for r in read_csv(V2 / "v1-a-v2.csv") if r["id_v2"] not in made_here}
        # D15: the standards the user decided by name (id_v1 → standard, with the reason and the evidence).
        self.decided = {r["id_v1"]: r for r in read_csv(DOCS / "glosario-decisiones.csv")}
        self.cas_of_material = {m["cas"]: m for m in self.materials if m["cas"]}


STEREO_GROUP = re.compile(r"\(\s*(?:rel-|[+\-±]|\d*[ezrs]\*?)(?:\s*[,/]\s*(?:\d*[ezrs]\*?|[+\-±]))*\s*\)", re.I)


def strip_stereo(name: str) -> str:
    """A name without its stereochemistry ((E), (2R,3S), cis-, trans-, rel-): what is left is the compound's name, whichever isomer."""
    n = STEREO_GROUP.sub(" ", name.lower())
    n = re.sub(r"(?<![a-z])(?:cis|trans|rel|dl|racemic)-", " ", n)
    return re.sub(r"[^a-z0-9]+", " ", n).strip()


def same_without_stereo(g: dict[str, str], std: str, data: Data) -> str:
    """D15: the name of this row, without its stereochemistry, is the name (or an IFRA synonym) of the standard's substance: that synonym, or «»."""
    mine = strip_stereo(g["nombre"])
    names = [data.standards[std]["nombre"], *(x for x in data.standards[std]["sinonimos"].split(" | ") if "(commercial name)" not in x)]
    for other in names:
        if mine and strip_stereo(other) == mine and other.strip():
            return other.strip()
    return ""


# D16: a standard IFRA defines by class applies when the text of the standard defines the class and the molecule is of it by structure
# (or the text names it). The evidence is the phrase of the standard plus the structure, never the regex of the v1.
ALLYL_ESTER = re.compile(r"^allyl (?!alcohol\b)(?!\S*cyanate$)(?P<acid>[a-z0-9 ,'()\-.]*ate)$", re.I)
PINACEAE_PHRASE = ("Los pinenos y el delta-3-careno se tratan como de origen pináceas mientras no conste otro origen (el usuario, 2026-10-04): "
                   "aplicar el 184 solo añade una especificación pendiente.")
PINENE_OR_CARENE = re.compile(r"^(?:(?:d|l|dl) )?(?:(?:alpha|beta|gamma) )?(?:(?:d|l|dl) )?pinene$|^(?:(?:d|l|dl) )?(?:delta )?3 carene$")
FAMILY_STANDARD = re.compile(r"familia, por el nombre:[^()]*\(STD (\d+)\)")


def first_sentence(text: str) -> str:
    return re.split(r"(?<=[a-z%)])\.\s", text.strip(), maxsplit=1)[0].rstrip(".") + "."


def class_member(std: str, g: dict[str, str], data: Data) -> tuple[bool, str]:
    """(applies, evidence): does the definition of the class in the standard's text resolve this molecule?"""
    s = data.standards[std]
    text = s["nota_especificacion"] or s["nota_restriccion"] or s["nota_prohibicion"] or ""
    if std == "IFRA_STD_188":
        m = ALLYL_ESTER.match(g["nombre"].strip())
        if m:
            return True, (f"el STD 188 dice: «{first_sentence(text)}»; la estructura: «{g['nombre']}» es el éster del alcohol alílico "
                          f"con el carboxilato «{m.group('acid')}»")
        return False, f"el STD 188 define la clase por estructura («Allyl esters»), y «{g['nombre']}» no es un éster del alcohol alílico por su nombre"
    if std == "IFRA_STD_184":
        # D16, closed list (the user, 2026-10-04): the pinenes and delta-3-carene. Not a rule by constituents: no other terpene.
        if PINENE_OR_CARENE.match(strip_stereo(g["nombre"])):
            return True, (f"«{PINACEAE_PHRASE}» (el usuario, 2026-10-04; lista cerrada de D16: pinenos y delta-3-careno); "
                          f"el STD 184 dice «derived from the Pinacea family», y «{g['nombre']}» está en la lista")
        return False, f"«{g['nombre']}» no está en la lista cerrada del STD 184 (pinenos y delta-3-careno, D16)"
    named = strip_stereo(g["nombre"])
    if named and len(named) > 6 and named in strip_stereo(text):
        return True, f"el texto del {std} nombra la molécula: «{g['nombre']}»"
    return False, f"el texto del {std} no define una clase que resuelva «{g['nombre']}»"


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
        fam = FAMILY_STANDARD.search(note)
        if fam:
            std = f"IFRA_STD_{int(fam.group(1)):03d}"
            applies, why = class_member(std, g, data)
            if applies:
                return "estandar-de-clase", std, why
            return "familia-por-nombre", note[:160], f"«{note[:200]}»; {why}"
        return "familia-por-nombre", note[:160], f"«{note[:200]}»"
    own = set(filter(None, re.split(r"[;,\s]+", g["estandares"])))
    indexed = set(data.index.get(cas, []))
    if own and own != indexed:
        std = sorted(own - indexed)[0]
        decision = data.decided.get(g["id"])
        if decision and decision["estandar"] == std:
            return "estandar-decidido", std, f"decisión del usuario: {decision['motivo']} (evidencia: {decision['evidencia']})"
        # D15: the glossary itself says it is the same substance as one the standard lists (another stereochemistry).
        synonym = same_without_stereo(g, std, data)
        if synonym:
            return ("estandar-por-evidencia", std,
                    f"el nombre «{g['nombre']}», sin estereoquímica, es el de «{synonym}» en los datos de IFRA del {std}: la misma sustancia con la estereoquímica sin especificar")
        same = re.search(r"es otra estereoquímica del CAS (\d{2,7}-\d{2}-\d)", g["fuera_de_ifra"])
        if same and std in data.index.get(same.group(1), []):
            return "estandar-por-evidencia", std, f"el glosario dice: «{g['fuera_de_ifra'][:160]}» y {std} lista el CAS {same.group(1)}"
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
    chosen = pending[:LOT_SIZE]
    if clase == "natural":
        # A name is one material (D14): its rows go together, in the lot of the first of them.
        chosen = []
        for group in natural_groups(pending, data):
            if len(chosen) + len(group) > LOT_SIZE:
                break
            chosen.extend(group)
    lots[name] = {"clase": clase, "fecha": date, "ids": chosen}
    return name


# --- naturals (D14): the identity is the term of the FIG; process and part are what the term says; the species is the annex's ---
PROCESS_OF_TYPE = {"oil": "aceite esencial", "extract": "extracto", "absolute": "absoluto", "resinoid": "resinoide", "oleoresin": "oleorresina",
                   "terpenes": "terpenos", "tincture": "tintura", "concrete": "concreto", "distillate": "destilado", "gum": "goma", "resin": "resina"}
PROCESS_WORDS = [(r"\brectified\b", "rectificado"), (r"\bterpene[- ]?less\b|\bterpene[- ]free\b|\bdeterpenated\b", "sin terpenos"),
                 (r"\bfcf\b", "FCF"), (r"\bfurocoumarin[- ]free\b", "sin furocumarinas"), (r"\bwashed\b", "lavado"),
                 (r"\bdecolou?rized\b", "decolorado"), (r"\bdewaxed\b", "sin ceras"), (r"\bco2\b", "CO2"), (r"\bexpressed\b", "expresión"),
                 (r"\bdistilled\b|\bredistilled\b", "destilación")]
PART_WORDS = [(r"\broots?\b", "raíz"), (r"\brhizomes?\b", "rizoma"), (r"\bleaf\b|\bleaves\b", "hoja"), (r"\bflowers?\b|\bblossoms?\b", "flor"),
              (r"\bseeds?\b", "semilla"), (r"\bbark\b", "corteza"), (r"\bwood\b", "madera"), (r"\bpeel\b|\brind\b|\bzest\b", "cáscara"),
              (r"\bfruits?\b|\bberr(?:y|ies)\b", "fruto"), (r"\bherb\b", "hierba"), (r"\bbuds?\b", "botón"), (r"\bneedles?\b", "aguja"),
              (r"\btwigs?\b", "ramita"), (r"\bbulbs?\b", "bulbo")]


def norm_name(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def natural_process(g: dict[str, str]) -> str:
    """What the term says about the process; «» (no lo dice) when the row has no type. Never taken from ISO 9235 (D14)."""
    base = PROCESS_OF_TYPE.get(g["tipo_natural"], "")
    if not base:
        return ""
    found = [word for pattern, word in PROCESS_WORDS if re.search(pattern, g["nombre"].lower())]
    return "; ".join([base, *found])


def natural_part(g: dict[str, str]) -> str:
    return " y ".join(word for pattern, word in PART_WORDS if re.search(pattern, g["nombre"].lower()))


def natural_case(cas_list: list[str], term: str, data: Data) -> tuple[str, list[str]]:
    """How the annex answers for this term, over all the CAS of its name: (case, the annex names that count)."""
    entries: dict[str, list[dict[str, str]]] = {}
    for cas in cas_list:
        for annex_name, rows in data.annex_by_cas.get(cas, {}).items():
            entries.setdefault(annex_name, []).extend(rows)
    if not entries:
        return "sin entrada en el anexo", []
    names = sorted(entries)
    if len(names) == 1:
        return "coincidencia única: el CAS tiene una sola entrada", names
    same = [n for n in names if norm_name(n) == norm_name(term)]
    if len(same) == 1:
        return "coincidencia única: el término coincide con una de varias", same
    return "peor caso: varias entradas y ninguna coincide con el término", names


def natural_groups(ids: list[str], data: Data) -> list[list[str]]:
    """D14, D1: a name is one material and its CAS are attributes: the rows with the same name are one group."""
    groups: dict[str, list[str]] = {}
    for ident in sorted(ids, key=sort_key):
        groups.setdefault(norm_name(data.glossary[ident]["nombre"]), []).append(ident)
    return list(groups.values())


def prepare_naturals(name: str, lot: dict, data: Data):
    counts: Counter = Counter()
    materials = []
    natural_cas_in_v2 = {m["cas"]: m for m in data.materials if m["tipo"] == "natural" and m["cas"]}
    for group in natural_groups(lot["ids"], data):
        rows = [data.glossary[i] for i in group]
        g = rows[0]
        cas_list = sorted({r["cas"] for r in rows if r["cas"]})
        case, names = natural_case(cas_list, g["nombre"], data)
        process = natural_process(g)
        part = natural_part(g)
        counts[case] += 1
        counts["con término" if process else "sin término: proceso «no lo dice»"] += 1
        if len(cas_list) > 1:
            counts["varios CAS en un solo material (el mismo nombre; D14)"] += 1
        if not cas_list:
            counts["sin CAS (entra: el CAS es un atributo, D1)"] += 1
        species = {a["nombre_botanico"] for n in names for c in cas_list for a in data.annex_by_cas.get(c, {}).get(n, [])}
        specie = next(iter(species)) if len(species) == 1 and "" not in species else ""
        if specie:
            counts["con especie del anexo (única)"] += 1
        if part:
            counts["con parte (la dice el término)"] += 1
        if any(c in natural_cas_in_v2 for c in cas_list):
            counts["algún CAS ya está en un natural de la v2 (entra aparte, sin fusionar)"] += 1
        cas_text = " ".join(cas_list) or "(ninguno)"
        notes = [f"Fase 6, lote {name} (D14): la identidad es el término del FIG «{g['nombre']}»; "
                 + (f"sus CAS ({cas_text}) son atributos." if len(cas_list) > 1 else f"el CAS {cas_text} es un atributo."),
                 f"Proceso: {process or 'no lo dice'}. Parte: {part or 'no lo dice'}. Especie: "
                 + (f"{specie}, la del anexo de IFRA 51, única para {'los CAS' if len(cas_list) > 1 else 'el CAS'} {cas_text}." if specie else "no lo dice.")]
        entry: dict = {"clave": "glosario-natural-" + group[0].replace(":", "-"), "tipo": "natural", "nombre": g["nombre"],
                       "cas": cas_list[0] if cas_list else "", "especie": specie or "no lo dice", "parte": part, "proceso": process, "v1": group}
        if len(cas_list) > 1:
            entry["otros_cas"] = cas_list[1:]
        if case.startswith("coincidencia"):
            entry["anexo"] = {"documento": "ifra51-anexo-naturales", "nombre": names[0], "cas_todos": cas_list}
            notes.append(f"Anexo de IFRA 51: la entrada «{names[0]}».")
        elif case.startswith("peor caso"):
            entry["anexo_peor"] = {"documento": "ifra51-anexo-naturales", "cas_todos": cas_list, "nombres": names}
            notes.append(f"Anexo de IFRA 51: hay {len(names)} entradas para {'estos CAS' if len(cas_list) > 1 else 'este CAS'} y el término no coincide con una sola; "
                         f"cuenta la peor de ellas: {'; '.join(names)}.")
        entry["notas"] = " ".join(notes)
        materials.append(entry)
    documents = []
    if any("anexo" in m or "anexo_peor" in m for m in materials):
        documents.append({"clave": "ifra51-anexo-naturales", "tipo": "anexo-ifra", "titulo": "IFRA 51, anexo de contribuciones de otras fuentes: naturales",
                          "emisor": "IFRA", "fecha": "2023-06", "ruta": "datos/ifra/51/naturales.csv", "estado_revision": "revisado",
                          "notas": "Archivo oficial de IFRA convertido por scripts/importar_ifra.py; sus cifras se toman tal cual."})
    entry_file = {"fecha": lot["fecha"], "notas": f"Fase 6, lote {name}: {len(lot['ids'])} naturales del glosario v1 (término del FIG y datos de IFRA).",
                  "documentos": documents, "materiales": materials}
    counts["entra"] = len(materials)
    return counts, entry_file, [], []


def prepare(name: str, lot: dict, data: Data) -> tuple[Counter, dict, list[dict[str, str]], list[dict[str, str]]]:
    """The entry of a lot, its conflicts and its links to substances the v2 already had."""
    if lot["clase"] == "natural":
        return prepare_naturals(name, lot, data)
    if lot["clase"] != "molécula":
        raise SystemExit(f"{name}: la clase «{lot['clase']}» aún no tiene lote preparado.")
    counts: Counter = Counter()
    conflicts: list[dict[str, str]] = []
    by_cas: dict[str, list[dict[str, str]]] = {}
    decisions_of: dict[str, list[dict[str, str]]] = {}
    links: list[dict[str, str]] = []
    for ident in lot["ids"]:
        g = data.glossary[ident]
        category, detail, evidence = classify(g, data)
        if category != "entra" and category not in DECIDED:
            counts[category] += 1
            conflicts.append({"producto": f"{ident} «{g['nombre']}»", "tipo": category, "detalle": detail, "evidencia": evidence,
                              "recomendacion": "no entra hasta que el usuario decida la categoría", "respuesta": ""})
            continue
        decided = {"estandar": detail, "motivo": f"{'D16' if category == 'estandar-de-clase' else 'D15'}, {category}: {evidence}"} if category in DECIDED else None
        if decided:
            counts[f"entra con estándar por el nombre ({DECIDED[category]})"] += 1
        existing = data.cas_of_material.get(g["cas"])
        if existing is not None:
            counts["enlazada a una sustancia de la v2"] += 1
            links.append({"id_v1": ident, "id_v2": existing["id"], "id_producto": "", "confirmado": "",
                          "motivo": f"Fase 6, lote {name}: el mismo CAS ({g['cas']}) que la sustancia de la v2"})
            continue
        by_cas.setdefault(g["cas"], []).append(g)
        if decided:
            decisions_of.setdefault(g["cas"], []).append(decided)
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
        if cas in decisions_of:
            entry["estandares_decididos"] = decisions_of[cas]
        schiff = data.schiff.get(cas)
        if schiff:
            entry["schiff"] = {"documento": "ifra51-bases-schiff", "cas": cas}
            counts["entra con el aldehído de IFRA (base de Schiff)"] += 1
        counts["entra"] += 1
        standards = list(data.index.get(cas, [])) + [d["estandar"] for d in decisions_of.get(cas, [])]
        if standards:
            counts["con estándar de IFRA"] += 1
        if any(data.standards[x]["especificacion"] == "sí" for x in standards if x in data.standards):
            counts["con especificación (pendiente por D11)"] += 1
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
    sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser()
    parser.add_argument("--aprobar", help="aprueba un lote preparado: pasa a altas/ para que alta.py lo escriba")
    parser.add_argument("--sin-aprobar", action="store_true", help="con --nuevo: el lote queda preparado, sin aprobar")
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
        if args.sin_aprobar:
            lots[newest]["aprobado"] = False
        path.write_text(json.dumps(lots, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    if args.aprobar:
        lots[args.aprobar].pop("aprobado", None)
        path.write_text(json.dumps(lots, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    all_links: list[dict[str, str]] = []
    results = {}
    for name, lot in lots.items():
        counts, built, conflicts, links = prepare(name, lot, data)
        # A lot with «aprobado: false» (conflicts to decide, or a class waiting for the user's go-ahead) is prepared, not given as an alta.
        approved = lot.get("aprobado", True)
        where, other = ("altas", "altas-preparadas") if approved else ("altas-preparadas", "altas")
        (DOCS / where).mkdir(exist_ok=True)
        (DOCS / where / f"{lot['fecha']}-glosario-{name}.json").write_text(
            json.dumps(built, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        (DOCS / other / f"{lot['fecha']}-glosario-{name}.json").unlink(missing_ok=True)
        write_csv(V2 / "conflictos" / f"{name}.csv", CONFLICT_COLUMNS, conflicts)
        if approved:
            all_links.extend(links)
        results[name] = (counts, conflicts)
    write_csv(DOCS / "enlaces-glosario.csv", ["id_v1", "id_v2", "id_producto", "confirmado", "motivo"], all_links)
    print("Resumen por lote (entradas | con estándar | con especificación | conflictos):")
    for key, (c, cf) in results.items():
        entered = len(lots[key]["ids"]) - len(cf)
        held = "" if lots[key].get("aprobado", True) else "  (preparado, sin aprobar)"
        print(f"  {key}: {entered:4} | {c['con estándar de IFRA']:4} | {c['con especificación (pendiente por D11)']:3} | {len(cf)}{held}")
    print()
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
