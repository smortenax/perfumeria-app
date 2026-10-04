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

sys.path.insert(0, str(Path(__file__).resolve().parent))
from identidad import identity_match, species_key  # noqa: E402

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
        # The genera the annex names (to see that a term names a species), the identity rules of D10 and the specifications left out by process.
        self.genera = {a["nombre_botanico"].split()[0] for rows in self.annex_by_cas.values() for lst in rows.values() for a in lst if a["nombre_botanico"].split()}
        self.identity_rules = [
            {"estandar": r["estandar"], "especies": {x.strip().lower() for x in r["especies"].split(";")},
             "partes": [x.strip().lower() for x in r["partes"].split(";")], "procesos": [x.strip().lower() for x in r["procesos"].split(";")],
             "excluye": [x.strip().lower() for x in r["excluye"].split(";") if x.strip()]}
            for r in read_csv(DOCS / "estandares-naturales.csv")]
        self.spec_exclusions = [(r["estandar"], [x.strip().lower() for x in r["procesos"].split(";") if x.strip()])
                                for r in read_csv(DOCS / "especificaciones-excluidas.csv")]
        self.later = {r["id_v1"] for r in read_csv(DOCS / "glosario-despues.csv")}
        # What the v2 had before the glossary lots: the materials these lots made (key «glosario-…») are not «what was there».
        made_here = {r["id"] for r in read_csv(V2 / "registro-ids.csv") if r["entidad"] == "material" and r["clave"].startswith("glosario-")}
        self.materials = [m for m in read_csv(V2 / "materiales.csv") if m["id"] not in made_here]
        self.linked = {r["id_v1"] for r in read_csv(V2 / "v1-a-v2.csv") if r["id_v2"] not in made_here}
        # D15: the standards the user decided by name (id_v1 → standard, with the reason and the evidence).
        self.decided = {r["id_v1"]: r for r in read_csv(DOCS / "glosario-decisiones.csv")}
        # Rows the user left out of the phase, in the v1 «sin revisar» (id_v1, motivo).
        self.left_out = {r["id_v1"] for r in read_csv(DOCS / "glosario-fuera.csv")}
        self.cas_of_material = {m["cas"]: m for m in self.materials if m["cas"]}


STEREO_GROUP = re.compile(r"\(\s*(?:rel-|[+\-±]|\d*[ezrs]\*?)(?:\s*[,/]\s*(?:\d*[ezrs]\*?|[+\-±]))*\s*\)", re.I)


def strip_stereo(name: str) -> str:
    """A name without its stereochemistry ((E), (2R,3S), cis-, trans-, rel-): what is left is the compound's name, whichever isomer."""
    n = STEREO_GROUP.sub(" ", name.lower())
    n = re.sub(r"(?<![a-z])(?:cis|trans|rel|dl|racemic)-", " ", n)
    return re.sub(r"[^a-z0-9]+", " ", n).strip()


def shared_ifra_synonyms(g: dict[str, str], std: str, data: Data) -> list[str]:
    """The synonyms (not the commercial names) that IFRA lists for the standard and the row of the glossary also has."""
    listed = {x.strip().lower(): x.strip() for x in data.standards[std]["sinonimos"].split(" | ") if x.strip() and "(commercial name)" not in x
              and x.strip().lower() != "not applicable."}
    mine = {x.strip().lower() for x in g["sinonimos"].split(" | ")}
    return [listed[k] for k in listed if k in mine]


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
        dropped = data.decided.get(g["id"])
        if dropped and dropped["estandar"] == "ninguno":
            return "estandar-descartado", "", f"decisión del usuario: {dropped['motivo']}"
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
        # D15, proposed by the session (2026-10-05): the row carries synonyms that IFRA lists for this standard and the glossary itself says it is
        # the same compound under another registry: IFRA's own scope note («any other CAS number used to identify this ingredient») covers it.
        shared = shared_ifra_synonyms(g, std, data)
        if shared and "es el mismo compuesto, con otro registro" in note:
            return ("estandar-por-evidencia", std,
                    f"propuesta de la sesión: el glosario trae sinónimos que IFRA lista para el {std} ({'; '.join(shared[:3])}) y dice «{note[:140]}»")
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


# The rows of the v1 that are products, not glossary (prod:, cert:, and the tienda: and cat: that only a shop or a catalog knows), and those the user left out by decision, are not of this phase (2026-10-04).
PRODUCT_PREFIXES = ("prod:", "cert:", "tienda:", "cat:")


def out_of_phase(ident: str, data: Data) -> bool:
    return ident.startswith(PRODUCT_PREFIXES) or ident in data.left_out


def effective_class(g: dict[str, str], data: Data) -> str:
    """A row the v1 had as a molecule but the annex of IFRA (by a CAS it has), a natural the v2 already has by that CAS, or the FIG (a type or an ISO 9235 category) gives as a natural goes by the way of naturals."""
    other = data.cas_of_material.get(g["cas"]) if g["cas"] else None
    if g["clase"] == "molécula" and ((g["cas"] and g["cas"] in data.annex_by_cas) or g["tipo_natural"] or g["categoria_iso"]
                                     or (other is not None and other["tipo"] == "natural")):
        return "natural"
    return g["clase"]


def freeze_next(clase: str, lots: dict, data: Data, date: str, only: list[str] | None = None) -> str | None:
    taken = {i for lot in lots.values() for i in lot["ids"]}
    pending = sorted(
        (i for i, g in data.glossary.items()
         if effective_class(g, data) == clase and not out_of_phase(i, data) and i not in data.linked and (i not in data.later or only is not None) and i not in taken),
        key=sort_key,
    )
    if only is not None:
        pending = [i for i in pending if i in only]
        missing = [i for i in only if i not in pending]
        if missing:
            raise SystemExit(f"No están pendientes de la clase «{clase}»: {', '.join(missing)}")
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


# D14, species: if the term of the FIG names a species, that is the material's; the annex's only when the term names none.
SPECIES_STOP = {
    "oil", "oils", "absolute", "absolutes", "concrete", "extract", "extracts", "resinoid", "resin", "tincture", "terpenes", "terpeneless", "distillate",
    "wood", "leaf", "leaves", "flower", "flowers", "root", "roots", "seed", "seeds", "peel", "peels", "fruit", "fruits", "bark", "herb", "needle",
    "needles", "balsam", "gum", "oleoresin", "infusion", "water", "distilled", "rectified", "essential", "and", "fraction", "rose", "spp", "essence",
}


def term_species(name: str, data: Data) -> str:
    """The species a term names: a binomial in parentheses (Rosa x centifolia L.), or a genus of the annex followed by an epithet. «» if none."""
    paren = re.search(r"\(([A-Z][a-z]+) (x )?([a-z]{3,}(?:-[a-z]+)?)\b", name)
    if paren and paren.group(3) not in SPECIES_STOP:
        return f"{paren.group(1)} {'x ' if paren.group(2) else ''}{paren.group(3)}"
    for genus in sorted(data.genera):
        m = re.search(r"\b" + genus + r" ([a-z]{4,}(?:-[a-z]+)?)\b", name)
        if m and m.group(1) not in SPECIES_STOP:
            return f"{genus} {m.group(1)}"
    return ""


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
    # In the order given: the first of a name is the one whose key the material has had since its lot, whatever joins it later.
    for ident in ids:
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
        annex_species = next(iter(species)) if len(species) == 1 and "" not in species else ""
        named = term_species(g["nombre"], data)
        discrepancy = ""
        if named:
            specie = named
            counts["con especie nombrada por el término"] += 1
            if annex_species and species_key(annex_species) != species_key(named):
                discrepancy = f" El anexo de IFRA 51 da «{annex_species}» para {'los CAS' if len(cas_list) > 1 else 'el CAS'} {' '.join(cas_list)}; gana el término."
                counts["especie del término distinta de la del anexo (gana el término)"] += 1
        else:
            specie = annex_species
            if specie:
                counts["con especie del anexo (el término no nombra ninguna)"] += 1
        if part:
            counts["con parte (la dice el término)"] += 1
        # For the summary of the lot: standards by CAS, members by identity (D10) and specifications left out by process.
        standards_here = sorted({std for c in cas_list for std in data.index.get(c, [])})
        if standards_here:
            counts["con estándar de IFRA"] += 1
        proc = process.lower()
        for rule in data.identity_rules:
            verdict = identity_match(rule, specie, part, process)
            if verdict == "excluido":
                counts["con exclusión por proceso aplicada"] += 1
                break
            if verdict == "miembro":
                counts["miembro por identidad (D10)"] += 1
                break
        if any(std in standards_here and any(w in proc for w in words) for std, words in data.spec_exclusions):
            counts["con exclusión por proceso aplicada"] += 1
        if any(c in natural_cas_in_v2 for c in cas_list):
            counts["algún CAS ya está en un natural de la v2 (entra aparte, sin fusionar)"] += 1
        cas_text = " ".join(cas_list) or "(ninguno)"
        notes = [f"Fase 6, lote {name} (D14): la identidad es el término del FIG «{g['nombre']}»; "
                 + (f"sus CAS ({cas_text}) son atributos." if len(cas_list) > 1 else f"el CAS {cas_text} es un atributo."),
                 f"Proceso: {process or 'no lo dice'}. Parte: {part or 'no lo dice'}. Especie: "
                 + (f"{specie}, la que nombra el término.{discrepancy}" if named
                    else f"{specie}, la del anexo de IFRA 51, única para {'los CAS' if len(cas_list) > 1 else 'el CAS'} {cas_text}; el término no nombra ninguna." if specie
                    else "no lo dice.")]
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
        if category != "entra" and category not in DECIDED and category != "estandar-descartado":
            counts[category] += 1
            conflicts.append({"producto": f"{ident} «{g['nombre']}»", "tipo": category, "detalle": detail, "evidencia": evidence,
                              "recomendacion": "no entra hasta que el usuario decida la categoría", "respuesta": ""})
            continue
        if category == "estandar-descartado":
            counts["entra sin el estándar que la v1 le daba por el nombre (decidido por el usuario)"] += 1
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
    parser.add_argument("--despues", action="store_true", help="con --nuevo: los ids de esa clase de docs/v2/glosario-despues.csv (los que usa la biblioteca)")
    parser.add_argument("--ids", help="con --nuevo: solo estos ids del glosario (separados por comas), por ejemplo los que cambian de vía")
    parser.add_argument("--aprobar", help="aprueba un lote preparado: pasa a altas/ para que alta.py lo escriba")
    parser.add_argument("--sin-aprobar", action="store_true", help="con --nuevo: el lote queda preparado, sin aprobar")
    parser.add_argument("--nuevo", help="clase de la que se congela el siguiente lote (molécula, natural, base)")
    args = parser.parse_args()
    data = Data()
    path = DOCS / "glosario-lotes.json"
    lots = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    newest = None
    if args.nuevo:
        only = args.ids.split(",") if args.ids else None
        if args.despues:
            only = [i for i in data.later if effective_class(data.glossary[i], data) == args.nuevo]
        newest = freeze_next(args.nuevo, lots, data, "2026-10-03", only)
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
        if lots[key]["clase"] != "molécula":
            continue
        entered = len(lots[key]["ids"]) - len(cf)
        held = "" if lots[key].get("aprobado", True) else "  (preparado, sin aprobar)"
        print(f"  {key}: {entered:4} | {c['con estándar de IFRA']:4} | {c['con especificación (pendiente por D11)']:3} | {len(cf)}{held}")
    print()
    print("Resumen de los lotes de naturales (entradas | coincidencia única | peor caso | sin anexo | con estándar | miembros D10 | exclusión por proceso):")
    for key, (c, cf) in results.items():
        if lots[key]["clase"] != "natural":
            continue
        unique = c["coincidencia única: el CAS tiene una sola entrada"] + c["coincidencia única: el término coincide con una de varias"]
        held = "" if lots[key].get("aprobado", True) else "  (preparado, sin aprobar)"
        print(f"  {key}: {c['entra']:4} | {unique:4} | {c['peor caso: varias entradas y ninguna coincide con el término']:4} | {c['sin entrada en el anexo']:4} | "
              f"{c['con estándar de IFRA']:4} | {c['miembro por identidad (D10)']:3} | {c['con exclusión por proceso aplicada']:3}{held}")
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
