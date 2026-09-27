"""Merges the house catalogues (Firmenich 2020, Givaudan 2024, Takasago 2024) into nombres-comerciales.csv."""
import csv, json, re, sys, unicodedata
from pathlib import Path

HERE = Path(__file__).parent
APP = Path("C:/Users/SERGI/Claude/Projects/perfumeria-app")
TRADE = APP / "datos/glosario/origen/nombres-comerciales.csv"
RANK = {"": 0, "baja": 1, "media": 2, "alta": 3}
KEEP_HOUSE_EMPTY = {"65442-31-1", "93-19-6", "1333-58-0"}
# What a catalogue adds to a name that is not the name: grades, dilutions, «new».
QUAL = re.compile(r"\b(new|nat|natural|synthetic|total|fab|pure|extra|flakes|crystals?|tech|conc(entrate)?|lg|hc|dl|eq|super|forte|(?<=\s)\d+(\.\d+)?\s*%?\s*(/\s*[\w\- ]+)?(\s*(tec|dpg|ipm|mip|dep|bb|cso|tea)\b)?)\b|\s-\s*\d+$", re.I)
# Takasago, by hand: a page read wrong, and a page whose CAS is not the product's.
TAKASAGO_FIX = {49: "Orbitone T"}
TAKASAGO_SKIP = {54: "Polyambrol: la ficha da el CAS 17283-81-7, que es la dihidro-beta-ionona de la página 19; su estructura es un octahidronaftalenol. Errata del catálogo."}


def norm(t):
    t = unicodedata.normalize("NFD", t).encode("ascii", "ignore").decode().lower()
    t = re.sub(r"\balpha\b", "a", t)
    t = re.sub(r"\bbeta\b", "b", t)
    return re.sub(r"[^a-z0-9]", "", t)


def title(name):
    """«HEDIONE HC» → «Hedione HC»: Firmenich writes in capitals."""
    if name != name.upper():
        return name
    return " ".join(w if len(w) <= 2 or any(c.isdigit() for c in w) else w.capitalize() for w in name.split())


def base_name(name):
    return re.sub(r"\s+", " ", QUAL.sub("", name)).strip(" -/")


glossary = list(csv.DictReader((APP / "datos/glosario/materiales.csv").open(encoding="utf-8")))
cache = json.loads((APP / "datos/glosario/.cache/pubchem.json").read_text(encoding="utf-8"))
chemical = {}
for m in glossary:
    chemical.setdefault(m["cas"], set()).update(
        norm(x) for x in [m["nombre"], *m["sinonimos"].split(" | "), *m["nombres_transparencia"].split(" | ")] if x)
for cas, v in cache.items():
    chemical.setdefault(cas, set()).update(norm(s) for s in v.get("sinonimos", []))


def words(t):
    """The words of a name in any order, without the l-, d-, dl- of the isomer: «Pinene beta» is «beta-Pinene»."""
    t = unicodedata.normalize("NFD", t).encode("ascii", "ignore").decode().lower()
    return " ".join(sorted(w for w in re.findall(r"[a-z0-9]+", t)
                           if w not in {"l", "d", "dl", "cis", "trans", "e", "z"} and not re.fullmatch(r"\d*[rs]", w)))


chemical_words = {}
for m in glossary:
    chemical_words.setdefault(m["cas"], set()).update(
        words(x) for x in [m["nombre"], *m["sinonimos"].split(" | "), *m["nombres_transparencia"].split(" | ")] if x)
for cas, v in cache.items():
    chemical_words.setdefault(cas, set()).update(words(x) for x in v.get("sinonimos", []))


def generic(name, cas):
    """True if the product name is only the chemical name, maybe with a grade («Citral Extra»)."""
    for n in (name, base_name(name), re.sub(r"\s+T$", "", name)):
        if norm(n) in chemical.get(cas, set()) or words(n) in chemical_words.get(cas, set()):
            return True
    return False


items = []  # (house, document, product, [cas], confidence of the CAS)
for r in csv.DictReader((HERE / "productos.csv").open(encoding="utf-8")):
    if r["cas"]:
        items.append((r["casa"], r["documento"], title(r["producto"]), r["cas"].split(), "media" if "PubChem" in r["via"] else "alta"))
for r in csv.DictReader((HERE / "takasago.csv").open(encoding="utf-8")):
    page = int(r["pagina"])
    if page in TAKASAGO_SKIP:
        continue
    items.append(("Takasago", "Takasago Aroma Ingredients Compendium (2024)", TAKASAGO_FIX.get(page, r["producto"]), r["cas"].split(), "alta"))

rows = {r["cas"]: r for r in csv.DictReader(TRADE.open(encoding="utf-8"))}
in_glossary = {m["cas"] for m in glossary}
added, others, skipped = [], [], []
for house, doc, product, cas_list, confidence in items:
    name = base_name(product) or product
    for cas in cas_list:
        if cas not in in_glossary:
            skipped.append(f"{product} ({cas}): fuera del glosario")
            continue
        if generic(product, cas):
            continue
        r = rows.get(cas)
        if r is None:
            r = rows[cas] = {"cas": cas, "nombre_comercial": "", "sigla": "", "otros_nombres": "", "casa": "",
                             "fuente": "", "confianza": "", "nota": ""}
        source = f"catálogo: {doc}"
        # A row with others and nothing in front was left so by the review: it stays so.
        reviewed_empty = not r["nombre_comercial"] and r["otros_nombres"]
        if not r["nombre_comercial"] and not reviewed_empty:
            r["nombre_comercial"] = name
            added.append(f"{cas} {name} ({house})")
            if RANK[confidence] > RANK.get(r["confianza"], 0):
                r["confianza"] = confidence
        elif not norm(name).startswith(norm(base_name(r["nombre_comercial"]))):
            current = [x for x in r["otros_nombres"].split(" | ") if x]
            if norm(name) not in {norm(x) for x in current}:
                r["otros_nombres"] = " | ".join(current + [name])
                others.append(f"{cas} {r['nombre_comercial']} + {name}")
        elif RANK[confidence] > RANK.get(r["confianza"], 0):
            r["confianza"] = confidence  # the house's catalogue backs the name in front
        if not r["casa"] and cas not in KEEP_HOUSE_EMPTY and norm(name) == norm(r["nombre_comercial"]):
            r["casa"] = house
        if source not in r["fuente"]:
            r["fuente"] = " · ".join(p for p in (r["fuente"], source) if p)

print(f"{len(added)} nombres nuevos; {len(others)} otros nombres; {len(skipped)} fuera del glosario")
print("nuevos:", *added, sep="\n  ")
print("otros:", *others[:40], sep="\n  ")
print("fuera:", *skipped[:40], sep="\n  ")
if "--escribir" in sys.argv:
    with TRADE.open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=["cas", "nombre_comercial", "sigla", "otros_nombres", "casa", "fuente", "confianza", "nota"], lineterminator="\n")
        w.writeheader()
        w.writerows(sorted(rows.values(), key=lambda r: r["cas"]))
    print("escrito", TRADE)
