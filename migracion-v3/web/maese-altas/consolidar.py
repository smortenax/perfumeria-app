"""Tandas 47 a 50 (V3-99): de la ficha de Maese Lab (tanda 45), lo leído en la web y PerfuMate, una propuesta de alta.

Uso: python3 -I migracion-v3/web/maese-altas/consolidar.py 47 aroma-chemicals

Lee:
- maese-perfumeria/consenso.csv y cruce.csv (tanda 45): los productos de la categoría que no son ya un común,
  su CAS comprobado, su INCI, su pureza y el impacto de PerfuMate cuando es el mismo material (rol «mismo»,
  V3-97). Lo estimado (diluciones, consenso general, palabras de la web) no entra como impacto.
- maese-perfumeria/fichas/*.txt: el perfil de olor que da Maese Lab.
- web-<tanda>-*.csv: lo leído en la web, una fila por campo y referencia (n es el número de la tanda 45).
- v3/datos/materials.csv: lo común, para no duplicar (por CAS, otros CAS o nombre).

Escribe propuesta-<tanda>.csv: un producto por fila. Cada campo elegido con normalizar.choose (el mismo
orden de referencias y la misma regla de disputados que la tanda 46). Una página de otro CAS no cuenta.
"""
import csv, json, re, sys, unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(HERE.parent / "completar-comunes"))
from normalizar import FIELD, choose, site, rank  # noqa: E402

TANDA, CATEGORY = sys.argv[1], sys.argv[2]
MAESE = HERE.parent / "maese-perfumeria"
OUT = HERE / f"propuesta-{TANDA}.csv"
OTHER_CAS = re.compile(r"CAS de (la|esa) (página|ficha) \S+,? no|no \d{2,7}-\d\d-\d|enanti|otro CAS|no coincide", re.I)


def norm(s):
    return re.sub(r"[^a-z0-9]+", " ", unicodedata.normalize("NFKD", s.lower())).strip()


consenso = {r["n"]: r for r in csv.DictReader(open(MAESE / "consenso.csv", encoding="utf-8"))}
cruce = {r["n"]: r for r in csv.DictReader(open(MAESE / "cruce.csv", encoding="utf-8"))}
perfil = {}
for path in sorted((MAESE / "fichas").glob("lote*.txt")):
    for line in open(path, encoding="utf-8"):
        parts = [p.strip() for p in line.split("¦")]
        if len(parts) >= 13 and parts[0].isdigit():
            perfil[parts[0]] = "" if parts[12] in ("—", "") else parts[12]
commons = [r for r in csv.DictReader(open(ROOT / "v3/datos/materials.csv", encoding="utf-8")) if not r["owner_id"]]
by_cas, by_name = {}, {}
for m in commons:
    for c in [m["cas"], *json.loads(m["other_cas"] or "[]")]:
        if c: by_cas[c] = m
    for n in [m["name"], *json.loads(m["aliases"] or "[]")]:
        by_name[norm(n)] = m

reads = {}
for path in sorted(HERE.glob(f"web-{TANDA}-*.csv")):
    for r in csv.DictReader(open(path, encoding="utf-8")):
        reads.setdefault((r["n"], r["campo"]), []).append(r)


# CAS que Maese Lab escribe mal (no pasan el dígito de control; tanda 45): el bueno.
CAS_FIX = {"4940-97-3": "101-97-3"}


def page_cas_ok(r, cas=""):
    """Una página de otro CAS no cuenta, salvo que sea el CAS bueno de uno que Maese escribe mal."""
    good = CAS_FIX.get(cas)
    return not OTHER_CAS.search(r["nota"]) or bool(good and re.search(rf"(da|dan|gives?) {good}|{good},? (no|NO)", r["nota"]))


def clean_name(v):
    v = re.split(r"\s+(?:[(/]|aka\b)", v)[0].strip()
    v = re.sub(r"[®™]|\s+-?\s*aroma chemicals?$", "", v, flags=re.I)
    return re.sub(r"\s+\d+(?:[.,]\d+)?\s*%$", "", v).strip()


out = []
for n, c in consenso.items():
    if c["categoria"] != CATEGORY or c["comun"]:
        continue
    x = cruce[n]
    rows = {campo: [r for r in reads.get((n, campo), []) if page_cas_ok(r, c["cas"])] for campo in
            ("nombre", "casa", "familia", "nivel", "horas", "fuerza", "estado", "dosis", "olor")}
    names = sorted([r for r in rows["nombre"] if r["valor"].strip()], key=lambda r: rank(r["fuente"]))
    full = names[0]["valor"].strip() if names else ""
    name = clean_name(full)
    if re.search(r"\d.*,.*\d|\d-\d.*-", name) and len(name) > 30:  # un nombre IUPAC: mejor el de la tienda
        name = clean_name(c["nombre_web"].split(" - ")[-1])
    name = (name[0].upper() + name[1:]) if name else clean_name(c["nombre_web"].split(" - ")[-1])
    inside = [p.strip(" )") for p in re.split(r"[(/;,]", full)[1:] if p.strip(" )")]
    cases = c["cas"].split()
    dup = next((by_cas[k] for k in cases if k in by_cas), None) or next(
        (by_name[k] for k in (norm(name), norm(c["nombre_web"]), norm(x["h1"])) if k in by_name), None) or next(
        (m for m in commons if norm(m["name"]).replace(" ", "") in {norm(c["nombre_web"]).replace(" ", ""), norm(name).replace(" ", "")}), None) or next(
        (by_cas[m] for r in reads.get((n, "nombre"), []) for m in re.findall(r"\d{2,7}-\d\d-\d", r["nota"] + r["valor"]) if m in by_cas), None)
    casa = next((r for r in sorted(rows["casa"], key=lambda r: rank(r["fuente"])) if r["valor"].strip()), None)
    row = {
        "n": n, "nombre": name, "nombre_fuente": names[0]["fuente"] if names else f"Maese Lab, {c['url']}: «{c['nombre_web']}»",
        "otros_nombres": json.dumps(sorted({c["nombre_web"], x["h1"], *inside, *[clean_name(r["valor"]) for r in names[1:]]} - {name, ""}), ensure_ascii=False),
        "cas": cases[0] if cases else "", "otros_cas": json.dumps(cases[1:]), "inci": c["inci"], "url": c["url"], "pureza": x["pureza"], "perfil_maese": perfil.get(n, ""),
        "casa": casa["valor"].strip() if casa else "", "casa_fuente": casa["fuente"] if casa else "",
        "impacto": c["impacto_propuesto"] if c["rol"] == "mismo" else "", "impacto_fuente": c["fuente"] if c["rol"] == "mismo" else "",
        "ya_comun": f"{dup['name']} ({dup['id']})" if dup else "",
    }
    for campo in ("familia", "nivel", "horas", "fuerza", "estado", "dosis"):
        value, first, disputed, otras, regla = choose(campo, rows[campo])
        f = FIELD[campo]
        row[f], row[f + "_fuente"] = value or "", first["fuente"] if first else ""
        row[f + "_disputado"] = "si" if value and disputed else ""
        row[f + "_otras"] = otras
    row["olores"] = json.dumps([[site(r["fuente"]), r["valor"].strip(), r["fuente"]] for r in rows["olor"] if r["valor"].strip()], ensure_ascii=False)
    row["sin_cas_bueno"] = "; ".join(f"{r['campo']}: {site(r['fuente'])} ({r['nota']})" for k, v in reads.items() if k[0] == n for r in v if not page_cas_ok(r, c["cas"]))
    out.append(row)

with open(OUT, "w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(out[0]), lineterminator="\n")
    w.writeheader(); w.writerows(out)
read = {k[0] for k in reads}
print(f"{len(out)} productos ({len([r for r in out if r['n'] in read])} leídos en la web); {sum(bool(r['ya_comun']) for r in out)} ya son un común;",
      {f: sum(bool(r[f]) for r in out) for f in ("family", "tier", "tenacity_hours", "strength", "physical_state", "dose", "impacto")})
