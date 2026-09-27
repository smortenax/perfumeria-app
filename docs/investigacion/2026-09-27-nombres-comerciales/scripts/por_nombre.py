"""The CAS of the product names still without one, asking PubChem by name."""
import csv, json, re, subprocess, time, urllib.parse
from pathlib import Path

HERE = Path(__file__).parent
APP = Path("C:/Users/SERGI/Claude/Projects/perfumeria-app")
CACHE = HERE / "por-nombre.json"
NATURAL = re.compile(r"\b(SFE|CITRONOVA|TERPENES|TETRAROME|ESS|EXT|FIRABS|FIRBEST|DECOL|EX BEANS|HEART|CARBONYLES|OIL|ABS)\b", re.I)
QUAL = re.compile(r"\b(new|nat|natural|total|fab|pure|extra|flakes|crystals?|tech|conc(entrate)?|s|tw|lg|super|\d+\s*%?\s*(/|in)?\s*(tec|dpg|ipm|mip|dep|bb|cso|ipm-tec|dowanol\s*tpm|tea)?)\b", re.I)
CAS = re.compile(r"^\d{2,7}-\d{2}-\d$")
AGENT = "perfumeria-app/0.1 (formulation tool; names to CAS)"

glossary = {r["cas"] for r in csv.DictReader((APP / "datos/glosario/materiales.csv").open(encoding="utf-8"))}
rows = list(csv.DictReader((HERE / "productos.csv").open(encoding="utf-8")))
cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}


def lookup(name):
    url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{urllib.parse.quote(name)}/xrefs/RN/JSON"
    for wait in (2, 4, 8):
        done = subprocess.run(["curl", "-s", "-m", "30", "-A", AGENT, "-w", "\n%{http_code}", url],
                              capture_output=True, text=True, encoding="utf-8", errors="replace")
        body, _, code = done.stdout.rpartition("\n")
        if code == "200":
            infos = json.loads(body)["InformationList"]["Information"]
            return sorted({rn for i in infos for rn in i.get("RN", []) if CAS.match(rn)})
        if code == "404":
            return []
        time.sleep(wait)
    return None


for r in rows:
    if r["cas"] or NATURAL.search(r["producto"]):
        continue
    name = re.sub(r"\s+", " ", QUAL.sub("", r["producto"])).strip()
    if not name:
        continue
    if name not in cache:
        cache[name] = lookup(name)
        time.sleep(0.4)
    found = [c for c in (cache[name] or []) if c in glossary]
    if found:
        r["cas"] = " ".join(found)
        r["via"] = "PubChem, por el nombre"
CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=1), encoding="utf-8")
with (HERE / "productos.csv").open("w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys()), lineterminator="\n")
    w.writeheader(); w.writerows(rows)
print("con CAS:", sum(1 for r in rows if r["cas"]), "de", len(rows))
print("por nombre:", [(r["producto"], r["cas"]) for r in rows if r["via"] == "PubChem, por el nombre"])
print("en PubChem pero fuera del glosario:", {n: v for n, v in cache.items() if v and not any(c in glossary for c in v)})
print("sin CAS:", [r["producto"] for r in rows if not r["cas"] and not NATURAL.search(r["producto"])])
