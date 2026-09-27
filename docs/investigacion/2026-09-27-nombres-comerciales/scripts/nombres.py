"""Product names from the house catalogues, and the CAS each one belongs to."""
import csv, json, re, unicodedata, collections
from pathlib import Path

HERE = Path(__file__).parent
APP = Path("C:/Users/SERGI/Claude/Projects/perfumeria-app")


def norm(t):
    t = unicodedata.normalize("NFD", t).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]", "", t)


# Qualifiers of a product that are not part of the material's name.
QUAL = re.compile(r"\b(new|nat|natural|total|fab|pure|extra|flakes|crystals?|coeur|\d+\s*%?\s*(/|in)?\s*(tec|dpg|ipm|mip|dep|bb|ipm|dowanol\s*tpm|tea)?)\b", re.I)


def clean(name):
    n = re.sub(r"[®™�*]|\bTM\b|(?<=[a-z])TM\b", "", name)
    return re.sub(r"\s+", " ", n).strip()


CATEGORIES = {"ALDEHYDIC", "ANIMALIC", "FRUITY", "AMBERY", "GOURMAND", "GREEN", "AROMATIC", "FLORAL", "MUSKY",
              "SPICY", "WATERY", "WOODY", "CITRUS", "BALSAMIC", "POWDERY", "LEATHERY", "HERBAL", "MARINE", "OZONIC"}
# Compounded bases and naturals: no CAS of a molecule.
BASE = re.compile(r"^(?:[A-Z]{1,3} )|\b(BASE|SYNTH|ABS|CONCRETE|RES|RESIN|EO|OIL|OUD|SUBST)\b")


def firmenich_2020():
    out = []
    for line in (HERE / "firmenich-2020.txt").read_text(encoding="latin-1").splitlines():
        for code, raw in re.findall(r"(\d{6})\s{1,3}(\S(?:.*?\S)?)(?=\s{3,}|\s*$)", line):
            words = clean(raw).split()
            while words and words[-1] in CATEGORIES:
                words.pop()
            name = " ".join(words)
            if name and not BASE.search(name):
                out.append(("dsm-firmenich (Firmenich)", "Firmenich Perfumery Ingredients 2020", code, name))
    return out


def givaudan():
    out = []
    for line in (HERE / "givaudan.txt").read_text(encoding="latin-1").splitlines():
        m = re.match(r"\s*(\d{7})\s+(.+?)\s*$", line)
        if m:
            out.append(("Givaudan", "Givaudan Fragrance Ingredients Sustainability Profile (2024)", m.group(1), clean(m.group(2))))
    return out


cache = json.loads((APP / "datos/glosario/.cache/pubchem.json").read_text(encoding="utf-8"))
by_syn = collections.defaultdict(set)
for cas, v in cache.items():
    for s in v.get("sinonimos", []):
        by_syn[norm(s)].add(cas)
glossary = list(csv.DictReader((APP / "datos/glosario/materiales.csv").open(encoding="utf-8")))
by_name = collections.defaultdict(set)
for m in glossary:
    for n in [m["nombre_comercial"], m["nombre"], *m["otros_nombres_comerciales"].split(" | "), *m["sinonimos"].split(" | ")]:
        if n:
            by_name[norm(re.sub(r"\(commercial name\)", "", n, flags=re.I))].add(m["cas"])
in_glossary = {m["cas"] for m in glossary}


def resolve(name):
    """The CAS of a product name: first the glossary's names, then PubChem's synonyms;
    with and without the product's qualifiers (NEW, NAT, 10 TEC…)."""
    tries = [name, QUAL.sub("", name)]
    for t in tries:
        k = norm(t)
        if not k:
            continue
        hits = by_name.get(k, set()) or by_syn.get(k, set())
        hits = {c for c in hits if c in in_glossary}
        if hits:
            return sorted(hits), ("glosario" if by_name.get(k) else "PubChem")
    return [], ""


rows = firmenich_2020() + givaudan()
resolved = []
for house, doc, code, name in rows:
    cas, how = resolve(name)
    resolved.append({"casa": house, "documento": doc, "codigo_producto": code, "producto": name,
                     "cas": " ".join(cas), "via": how})
with (HERE / "productos.csv").open("w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(resolved[0].keys()), lineterminator="\n")
    w.writeheader(); w.writerows(resolved)
c = collections.Counter((r["documento"][:25], bool(r["cas"])) for r in resolved)
print(len(resolved), "productos;", dict(c))
print("sin CAS:", [r["producto"] for r in resolved if not r["cas"]][:80])
print("varios CAS:", [(r["producto"], r["cas"]) for r in resolved if " " in r["cas"]][:20])
