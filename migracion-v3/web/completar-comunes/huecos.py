"""Tanda 46 (V3-99): lo que le falta a cada común y lo que PerfuMate (local) puede decir de ello.

Lee v3/datos/ (lo aprobado) y migracion-v3/perfumate/perfumate.sqlite3. Escribe huecos.csv: un común
por fila con los campos que le faltan y, de PerfuMate (por CAS; si no, por nombre o alias), la familia,
las horas y la dilución de trabajo, para contrastarlos después con la web. No cambia ningún dato.

    python3 -I migracion-v3/web/completar-comunes/huecos.py
"""
import csv, json, re, sqlite3, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent / "huecos.csv"
CAS = re.compile(r"\d{2,7}-\d\d-\d")

def norm(s):
    s = unicodedata.normalize("NFKD", s.lower())
    return re.sub(r"[^a-z0-9]+", " ", s).strip()

mats = [r for r in csv.DictReader(open(ROOT / "v3/datos/materials.csv", encoding="utf-8")) if not r["owner_id"]]
doses = {r["material_id"] for r in csv.DictReader(open(ROOT / "v3/datos/material_doses.csv", encoding="utf-8"))}
db = sqlite3.connect(f"file:{ROOT / 'migracion-v3/perfumate/perfumate.sqlite3'}?mode=ro", uri=True)
pm = []
for name, url, cas, fam, hours, htext, dil in db.execute(
        "SELECT name, source_url, cas, primary_odor_category, substantivity_hours, substantivity_text, working_dilution, synonyms_json FROM materials".replace(", synonyms_json", "")):
    pm.append((name, url, set(CAS.findall(cas or "")), fam, hours, htext, dil))
syn = {r[0]: [norm(x) for x in json.loads(r[1] or "[]")] for r in db.execute("SELECT name, synonyms_json FROM materials")}

FIELDS = [("familia", "family"), ("nivel", "tier"), ("horas", "tenacity_hours"), ("fuerza", "strength"),
          ("estado", "physical_state")]
rows = []
for m in mats:
    if m["solvent"] == "true":
        continue
    falta = [k for k, f in FIELDS if not m[f].strip()]
    if m["id"] not in doses:
        falta.append("dosis")
    if not falta:
        continue
    cases = {m["cas"]} | set(json.loads(m["other_cas"] or "[]"))
    cases.discard("")
    names = {norm(m["name"])} | {norm(a) for a in json.loads(m["aliases"] or "[]")}
    hit = [p for p in pm if p[2] & cases] or [p for p in pm if norm(p[0]) in names or set(syn.get(p[0], [])) & names]
    how = "cas" if hit and hit[0][2] & cases else ("nombre" if hit else "")
    def col(i):
        return " | ".join(sorted({str(p[i]) for p in hit if p[i] not in (None, "")}))
    rows.append({
        "id": m["id"], "nombre": m["name"], "tipo": m["kind"], "cas": m["cas"], "especie": m["species"],
        "falta": ", ".join(falta), "n_huecos": len(falta), "impacto": m["impact"],
        "pm_como": how, "pm_nombres": " | ".join(p[0] for p in hit), "pm_url": " | ".join(p[1] for p in hit),
        "pm_familia": col(3), "pm_horas": col(4), "pm_horas_texto": col(5), "pm_dilucion": col(6),
    })
rows.sort(key=lambda r: (-r["n_huecos"], r["nombre"]))
with open(OUT, "w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0]), lineterminator="\n")
    w.writeheader(); w.writerows(rows)
print(len(rows), "comunes con huecos;", sum(1 for r in rows if r["pm_como"]), "en PerfuMate")
