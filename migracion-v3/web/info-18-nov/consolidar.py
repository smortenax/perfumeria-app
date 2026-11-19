"""Tanda 60: de lo leído en la web (web-60-*.csv), la página de Perfumiarz y PerfuMate, la propuesta para
completar los 44 comunes de la tanda 57.

    python3 -I migracion-v3/web/info-18-nov/consolidar.py   → propuesta-60.csv

Las mismas reglas que las tandas 46 y 47 (normalizar.choose): orden de referencias (TGSC, la casa,
Fraterworks…, PerfuMate la última) y, si no coinciden, va la primera y el campo queda disputado. Una página
de otro CAS, otra especie u otro proceso no cuenta. El impacto, solo de PerfuMate y cuando es el mismo
material (V3-97): una molécula, por su CAS (y si PerfuMate tiene varias fichas con ese CAS, la de su
nombre); un natural o una base, por su nombre y su casa.
"""
import csv, json, re, sqlite3, sys, unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(HERE.parent / "completar-comunes"))
from normalizar import FIELD, choose, site, rank  # noqa: E402

OUT = HERE / "propuesta-60.csv"
OTHER = re.compile(r"otro CAS|CAS de la página \S+,? no|no coincide|otra especie|otro proceso|otra parte|otro grado|otro producto|parecido|no idéntic", re.I)
# Lo que no es una frase copiada de la página: reconstruida, resumida o generada por IA (aviso del lector).
NOT_LITERAL = re.compile(r"verificar|reconstruid|resumen|\bIA\b|generad[ao] por|generative|AI-generated|WebFetch|^scent\.vn", re.I)


def norm(s):
    s = "".join(ch for ch in unicodedata.normalize("NFKD", s.lower()) if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", " ", re.sub(r"[®™]", "", s)).strip()


lista = list(csv.DictReader(open(HERE / "lista.csv", encoding="utf-8")))
fichas = {r["n"]: r for r in csv.DictReader(open(HERE.parent / "perfumiarz-pedido-18-nov/fichas.csv", encoding="utf-8"))}
materials = {r["id"]: r for r in csv.DictReader(open(ROOT / "v3/datos/materials.csv", encoding="utf-8"))}
reads = {}
for path in sorted(HERE.glob("web-60-*.csv")):
    for r in csv.DictReader(open(path, encoding="utf-8")):
        reads.setdefault((r["n"].strip(), r["campo"].strip()), []).append(r)

db = sqlite3.connect(f"file:{ROOT / 'migracion-v3/perfumate/perfumate.sqlite3'}?mode=ro", uri=True)
PM = db.execute("SELECT name, supplier, cas, impact, primary_odor_category, substantivity_hours, substantivity_text, source_url FROM materials").fetchall()


def perfumate(m, shop_name):
    """La ficha de PerfuMate que es el mismo material, o None; y por qué."""
    names = {norm(m["name"]), norm(shop_name), *[norm(a) for a in json.loads(m["aliases"] or "[]")]}
    names = {re.sub(r"\s+\d+(?: \d+)?\s*(?:dpg|ipm|tec)?$", "", x) for x in names if x}
    house = norm(m["house"] or "")
    named = [p for p in PM if norm(p[0]) in names]
    if m["kind"] == "molecule" and m["cas"]:
        same_cas = [p for p in PM if m["cas"] in re.split(r"[\s,;/]+", p[2] or "")]
        pick = [p for p in same_cas if norm(p[0]) in names] or same_cas
        if pick:
            return pick, "por CAS" + (" y nombre" if any(norm(p[0]) in names for p in pick) else "")
        named = [p for p in named if not house or not p[1] or house.split()[0] in norm(p[1])]
        return (named, "por nombre y casa (el CAS de PerfuMate es otro: " + ", ".join(p[2] or "—" for p in named) + ")") if named else (None, "")
    named = [p for p in named if not p[1] or not house or house.split()[0] in norm(p[1])]
    return (named, "por nombre" + (" y casa" if any(p[1] for p in named) else "")) if named else (None, "")


out = []
for x in lista:
    n = x["n"]
    # Un alta nueva (Tropicalia, que la tanda 57 dejó en espera): aún no está en lo común.
    m = materials.get(x["id"]) or {"name": x["nombre"], "kind": x["tipo"], "aliases": "[]", "house": "", "cas": "", "tier": "", "physical_state": ""}
    shop = fichas.get(n, {})
    rows = {campo: [r for r in reads.get((n, campo), []) if not OTHER.search(r["nota"]) and not NOT_LITERAL.search(r["nota"] + " " + r["fuente"]) and not r["fuente"].startswith("scent.vn")] for campo in
            ("familia", "nivel", "horas", "fuerza", "estado", "dosis", "olor", "casa", "cas", "tipo", "nombre")}
    pm, why = perfumate(m, shop.get("producto", ""))
    if pm:
        p = pm[0]
        if p[4]:
            rows["familia"].append({"valor": p[4], "fuente": f"PerfuMate, {p[7]}: «{p[4]}»", "nota": "", "campo": "familia"})
        if p[5]:
            rows["horas"].append({"valor": f"{p[5]:g} h", "fuente": f"PerfuMate, {p[7]}: «{p[6] or f'{p[5]:g} h'}»", "nota": "", "campo": "horas"})
    impacts = sorted({p[3] for p in (pm or []) if p[3] is not None})
    row = {"n": n, "id": x["id"], "nombre": m["name"], "tipo": m["kind"],
           "impacto": str(impacts[0]) if impacts else "",
           "impacto_fuente": f"PerfuMate, {pm[0][7]}: «impact {pm[0][3]}» ({pm[0][0]}; {why})" if impacts else "",
           "impacto_disputado": "si" if len(impacts) > 1 else "",
           "impacto_otras": "; ".join(f"PerfuMate {p[0]}: {p[3]}" for p in pm[1:]) if pm and len(impacts) > 1 else ""}
    for campo in ("familia", "nivel", "horas", "fuerza", "estado", "dosis"):
        value, first, disputed, otras, regla = choose(campo, rows[campo], tincture="tincture" in m["name"])
        f = FIELD[campo]
        already = bool(m.get(f, ""))
        row[f] = "" if already else value or ""
        row[f + "_fuente"] = "" if already or not first else first["fuente"]
        row[f + "_disputado"] = "si" if value and disputed and not already else ""
        row[f + "_otras"] = "" if already else otras
        row[f + "_regla"] = "ya lo tenía (tanda 57)" if already else regla
    casa = next((r for r in sorted(rows["casa"], key=lambda r: rank(r["fuente"])) if r["valor"].strip()), None)
    row["casa"] = casa["valor"].strip() if casa and not m["house"] else ""
    row["casa_conflicto"] = f"{casa['fuente']} (la tanda 57 puso «{m['house']}», de Perfumiarz)" if casa and m["house"] and norm(casa["valor"]).split()[0] not in norm(m["house"]) and norm(m["house"]).split()[0] not in norm(casa["valor"]) else ""
    row["casa_fuente"] = casa["fuente"] if casa and not m["house"] else ""
    cas = next((r for r in sorted(rows["cas"], key=lambda r: rank(r["fuente"])) if re.fullmatch(r"\d{2,7}-\d\d-\d", r["valor"].strip())), None)
    row["cas_nuevo"] = cas["valor"].strip() if cas and not m["cas"] else ""
    row["cas_fuente"] = cas["fuente"] if cas and not m["cas"] else ""
    # Un natural se identifica por especie, parte y proceso: si la casa da otro CAS, queda en disputa (lo decide el usuario).
    other_cas = sorted({c for r in reads.get((n, "nombre"), []) for c in re.findall(r"CAS de la página (\d{2,7}-\d\d-\d)", r["nota"]) if m["cas"] and c != m["cas"]})
    row["cas_conflicto"] = "; ".join(f"{c} ({next(r['fuente'] for r in reads[(n, 'nombre')] if c in r['nota'])})" for c in other_cas) if m["kind"] != "molecule" else ""
    row["alta"] = "si" if x["id"] not in materials else ""
    kinds = {r["valor"].strip().lower() for r in rows["tipo"] if r["valor"].strip()}
    row["tipo_web"] = " / ".join(sorted(kinds))
    olores = [[site(r["fuente"]), r["valor"].strip(), r["fuente"]] for r in rows["olor"] if r["valor"].strip()]
    zap = re.match(r"Zapach:\s*(.+?)\s+(?=[A-ZŚŻŹĆŁ0-9])", shop.get("opis", ""))
    if zap:
        olores.append(["Perfumiarz", zap.group(1).strip(), f"Perfumiarz, {shop['url']}: «Zapach: {zap.group(1).strip()}»"])
    row["olores"] = json.dumps(olores, ensure_ascii=False)
    row["no_usado"] = "; ".join(f"{r['campo']}: {site(r['fuente'])} ({r['nota']})" for k, v in reads.items() if k[0] == n for r in v if r["valor"].strip() and (OTHER.search(r["nota"]) or NOT_LITERAL.search(r["nota"] + " " + r["fuente"])))
    out.append(row)

with open(OUT, "w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(out[0]), lineterminator="\n")
    w.writeheader(); w.writerows(out)
read = {k[0] for k in reads}
print(f"{len(out)} comunes ({len([r for r in out if r['n'] in read])} leídos en la web);",
      {f: sum(bool(r[f]) for r in out) for f in ("family", "tenacity_hours", "strength", "dose", "impacto", "casa", "cas_nuevo")})
