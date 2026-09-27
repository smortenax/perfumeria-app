"""Pieces for the trade-name judgement: per CAS, the glossary names, IFRA's commercial names and PubChem's candidates."""
import csv, json, re
from pathlib import Path
from candidatos import candidates
APP = Path("C:/Users/SERGI/Claude/Projects/perfumeria-app")
OUT = Path(__file__).parent / "comerciales"
OUT.mkdir(exist_ok=True)
cache = json.loads((APP / "datos/glosario/.cache/pubchem.json").read_text(encoding="utf-8"))
rows = list(csv.DictReader((APP / "datos/glosario/materiales.csv").open(encoding="utf-8")))
names = {}
for r in rows:
    if r["clase"] == "molécula" and r["cas"]:
        names.setdefault(r["cas"], [])
        if r["nombre"] not in names[r["cas"]]:
            names[r["cas"]].append(r["nombre"])
ifra = {}
for r in csv.DictReader((APP / "datos/ifra/51/estandar-cas.csv").open(encoding="utf-8")):
    for s in r["sinonimos"].split(" | "):
        if "(commercial name)" in s.lower():
            ifra.setdefault(r["cas"], []).append(re.sub(r"\s*\(commercial name\)", "", s, flags=re.I).strip())
cas_of = {}
for r in csv.DictReader((APP / "datos/ifra/51/estandar-cas.csv").open(encoding="utf-8")):
    cas_of.setdefault(r["estandar"], set()).add(r["cas"])
for r in csv.DictReader((APP / "datos/ifra/51/estandares.csv").open(encoding="utf-8")):
    if len(cas_of.get(r["estandar"], ())) == 1:
        cas = next(iter(cas_of[r["estandar"]]))
        for x in r["sinonimos"].split(" | "):
            if "(commercial name)" in x.lower():
                name = re.sub(r"\s*\(commercial name\)", "", x, flags=re.I).strip()
                if name not in ifra.setdefault(cas, []):
                    ifra[cas].append(name)
done = set()
for f in OUT.glob("lote-*.txt"):
    done |= {l.split(" | ")[0] for l in f.read_text(encoding="utf-8").splitlines() if l}
first = max([int(re.search(r"(\d+)", f.stem).group(1)) for f in OUT.glob("lote-*.txt")] or [0]) + 1
lines = []
for cas in sorted((c for c in names if c not in done), key=lambda c: names[c][0].lower()):
    v = cache.get(cas, {})
    cand = candidates(v.get("sinonimos", []), names[cas][0])
    lines.append(f"{cas} | {' / '.join(names[cas])} | IFRA: {', '.join(ifra.get(cas, [])) or '-'} | PubChem: {' ; '.join(cand) or '-'}")
size = 400
for i in range(0, len(lines), size):
    (OUT / f"lote-{first + i // size}.txt").write_text("\n".join(lines[i:i + size]) + "\n", encoding="utf-8")
print(len(lines), "CAS in", (len(lines) + size - 1) // size, "pieces;", sum(1 for l in lines if l.endswith("PubChem: -")), "without PubChem candidates;", sum(len(l) for l in lines) // 4, "tokens approx")
