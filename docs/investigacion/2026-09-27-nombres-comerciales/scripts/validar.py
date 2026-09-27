"""Checks the trade-name pass against its sources and writes datos/glosario/origen/nombres-comerciales.csv."""
import csv, json, re, sys, unicodedata, collections
from pathlib import Path

HERE = Path(__file__).parent
APP = Path("C:/Users/SERGI/Claude/Projects/perfumeria-app")
cache = json.loads((APP / "datos/glosario/.cache/pubchem.json").read_text(encoding="utf-8"))
molecules = {r["cas"] for r in csv.DictReader((APP / "datos/glosario/materiales.csv").open(encoding="utf-8")) if r["clase"] == "molécula"}


def norm(t):
    t = unicodedata.normalize("NFD", t).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]", "", t)


ifra = collections.defaultdict(set)
for line in (HERE).glob("lote-*.txt"):
    for l in line.read_text(encoding="utf-8").splitlines():
        cas, _, rest = l.partition(" | ")
        m = re.search(r"\| IFRA: (.*?) \| PubChem:", l)
        if m and m.group(1) != "-":
            ifra[cas] |= {norm(x) for x in m.group(1).split(", ")}

raw = {}
for f in sorted(HERE.glob("salida-*.csv")):
    for r in csv.DictReader(f.open(encoding="utf-8")):
        r = {k: (v or "").strip() for k, v in r.items()}
        r["_de"] = f.name
        raw[r["cas"]] = r
# The review over the pass: a value replaces, «-» empties, and nothing leaves it as it was.
for r in csv.DictReader((HERE / "suplemento.csv").open(encoding="utf-8")):
    base = raw.setdefault(r["cas"], {k: "" for k in r} | {"_de": "suplemento.csv"})
    for k, v in r.items():
        v = (v or "").strip()
        if v == "-":
            base[k] = ""
        elif v:
            base[k] = v
    base["_de"] += " + suplemento"
# A row with only other names is kept: the review left nothing in front on purpose.
raw = {c: r for c, r in raw.items() if r.get("nombre_comercial") or r.get("sigla") or r.get("otros_nombres")}

rows, problems = [], []
for cas, r in raw.items():
    if True:
        f = type("F", (), {"name": r["_de"]})
        cas = r["cas"]
        where = f"{f.name} {cas}"
        if cas not in molecules:
            problems.append(f"{where}: CAS fuera del glosario de moléculas")
            continue
        syn = {norm(s) for s in cache.get(cas, {}).get("sinonimos", [])}
        cid = (cache.get(cas, {}).get("cid") or [None])[0]

        def source(name, said, what):
            if not name:
                return ""
            if said == "pubchem":
                if norm(name) not in syn and not any(norm(name) in s for s in syn):
                    problems.append(f"{where}: {what} «{name}» no está en PubChem para ese CAS")
                    return "uso del sector"
                return f"PubChem CID {cid}"
            if said == "ifra":
                if norm(name) not in ifra.get(cas, set()):
                    problems.append(f"{where}: {what} «{name}» no está entre los de IFRA")
                    return "uso del sector"
                return "IFRA 51.ª, commercial name"
            if said == "uso-del-sector":
                if norm(name) in syn:
                    return f"PubChem CID {cid}"
                return "uso del sector"
            problems.append(f"{where}: fuente desconocida «{said}»")
            return "uso del sector"

        f_name = source(r["nombre_comercial"], r["fuente_nombre"], "el nombre")
        f_code = source(r["sigla"], r["fuente_sigla"], "la sigla")
        confidence = r["confianza"]
        if "uso del sector" in (f_name, f_code) and confidence == "alta":
            confidence = "media"
        parts = [p for p in (f"nombre: {f_name}" if f_name else "", f"sigla: {f_code}" if f_code else "") if p]
        rows.append({"cas": cas, "nombre_comercial": r["nombre_comercial"], "sigla": r["sigla"],
                     "otros_nombres": r["otros_nombres"], "casa": r["casa"], "fuente": " · ".join(parts),
                     "confianza": confidence, "nota": r["nota"]})

by_cas = collections.Counter(r["cas"] for r in rows)
problems += [f"CAS repetido: {c}" for c, n in by_cas.items() if n > 1]
by_name = collections.defaultdict(list)
for r in rows:
    if r["nombre_comercial"]:
        by_name[norm(r["nombre_comercial"])].append(r["cas"])
notes = [f"el mismo nombre en varios CAS: {n} → {c}" for n, c in by_name.items() if len(c) > 1]

print(f"{len(rows)} filas; {sum(1 for r in rows if r['nombre_comercial'])} con nombre, {sum(1 for r in rows if r['sigla'])} con sigla")
print("confianza:", collections.Counter(r["confianza"] for r in rows))
print("fuentes del nombre:", collections.Counter(r["fuente"].split(" · ")[0].split(" CID")[0] for r in rows))
print(f"{len(problems)} problemas:"); print("\n".join(problems[:80]))
print(f"{len(notes)} nombres compartidos:"); print("\n".join(notes[:40]))
if "--escribir" in sys.argv:
    out = APP / "datos/glosario/origen/nombres-comerciales.csv"
    with out.open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()), lineterminator="\n")
        w.writeheader()
        w.writerows(sorted(rows, key=lambda r: r["cas"]))
    print("escrito", out)
