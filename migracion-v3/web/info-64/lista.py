"""Tanda 64: los 55 productos del pedido de Perfumiarz del 19-nov (el usuario, 2026-11-22: «Busca el último
pedido de perfumiarz el que aún no está dado de alta que tiene entre los componentes whool absolute y resina
de Oman… que se prepare ya todos los datos para los materiales»), con su común y lo que le falta.

    python3 -I migracion-v3/web/info-64/lista.py   → lista.csv
"""
import collections, csv, json, re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
D = ROOT / "v3/datos"
rd = lambda p: list(csv.DictReader(open(p, encoding="utf-8")))
commons = [m for m in rd(D / "materials.csv") if not m["owner_id"]]
fichas = rd(HERE.parent / "perfumiarz-pedido-18-nov/fichas.csv")


def count(name):
    c = collections.Counter()
    for r in rd(D / name):
        if not r.get("owner_id"):
            c[r["material_id"]] += 1
    return c


comp, dose, desc = count("material_components.csv"), count("material_doses.csv"), count("material_descriptors.csv")
annex = {r["natural_cas"] for r in rd(D / "ifra_annex.csv")}
subs = {r["cas"] for r in rd(D / "ifra_substances.csv")}
out = []
for f in fichas:
    if f["url"]:
        url = re.escape(f["url"])
        ms = [m for m in commons if re.search(url + r"(?![\w-])", m["sources"])]
    else:  # Perfumiarz has no page for it (Ambrostar, Tropicalia, Orionide): the common of that name.
        key = re.sub(r"[®™]| Oliffac", "", f["producto"]).strip().lower()
        ms = [m for m in commons if m["name"].lower() == key]
    if len(ms) != 1:
        raise SystemExit(f"{f['n']} {f['producto']}: {len(ms)} comunes")
    m = ms[0]
    natural_or_base = m["kind"] in ("natural", "composition")
    want = [
        "familia" if not m["family"] else "",
        "horas" if not m["tenacity_hours"] else "",
        "fuerza" if not m["strength"] else "",
        "impacto" if not m["impact"] else "",
        "dosis" if not dose[m["id"]] else "",
        "olor" if desc[m["id"]] < 2 else "",
        "fisico" if not (m["density"] or m["solubility"]) else "",
    ]
    cases = {c for c in [m["cas"], *json.loads(m["other_cas"] or "[]")] if c}
    ifra_basis = " + ".join(x for x in (
        "constituyentes" if comp[m["id"]] else "",
        "anexo IFRA" if cases & annex else "",
        "CAS en IFRA" if cases & subs else "",
    ) if x) or ("nada" if natural_or_base else "CAS (sin estándar)")
    out.append({
        "n": f["n"], "material_id": m["id"], "nombre": m["name"], "producto": f["producto"], "tipo": m["kind"], "forma": m["form"],
        "cas": m["cas"], "casa": m["house"], "url_producto": f["url"],
        "ifra_perfumiarz": f["ifra"], "sds_perfumiarz": f["sds"], "alergenos_perfumiarz": f["eu_allergens"],
        "base_ifra": ifra_basis or "nada", "constituyentes": comp[m["id"]],
        "buscar": " ".join(w for w in want if w),
    })
with open(HERE / "lista.csv", "w", encoding="utf-8", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(out[0]), lineterminator="\n"); w.writeheader(); w.writerows(out)
print(f"{len(out)} productos; sin certificado IFRA en Perfumiarz: {sum(not o['ifra_perfumiarz'] for o in out)}; IFRA sin base: {sum(o['base_ifra']=='nada' for o in out)}")
for o in out:
    print(o["n"], o["nombre"], o["tipo"], "| IFRA pz:", "sí" if o["ifra_perfumiarz"] else "no", "|", o["base_ifra"], "|", o["buscar"])
