"""Tanda 63: los descriptores de olor de TGSC que publica Pyrfume (pyrfume-data/goodscents), para las
moléculas de lista.csv (el usuario, 2026-11-19: «usa los de pyrfume y guardo yo las páginas»).

    python3 -I migracion-v3/web/tgsc/pyrfume.py <carpeta-caché>   → pyrfume-63.csv

Baja behavior.csv (CAS → descriptores) y stimuli.csv (CAS → id de TGSC, concentración y disolvente con
que se olió) de la rama main de pyrfume-data, una vez (caché fuera de Git), y apunta su sha256. Solo
moléculas, por CAS exacto: un natural no se cruza por CAS (lo comparten especies).
"""
import csv, hashlib, sys, urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "completar-comunes"))
from normalizar import family  # noqa: E402  (la palabra de la referencia → la familia de la app, como en las tandas 46 a 62)
commons = {m["id"]: m for m in csv.DictReader(open(HERE.parents[2] / "v3/datos/materials.csv", encoding="utf-8")) if not m["owner_id"]}
CACHE = Path(sys.argv[1]); CACHE.mkdir(parents=True, exist_ok=True)
RAW = "https://raw.githubusercontent.com/pyrfume/pyrfume-data/main/goodscents/"
files = {}
for name in ("behavior.csv", "stimuli.csv"):
    p = CACHE / name
    if not p.exists():
        with urllib.request.urlopen(urllib.request.Request(RAW + name, headers={"User-Agent": "research script"}), timeout=60) as r:
            p.write_bytes(r.read())
    files[name] = (p, hashlib.sha256(p.read_bytes()).hexdigest())
behavior = {r["Stimulus"]: r["Descriptors"] for r in csv.DictReader(open(files["behavior.csv"][0], encoding="utf-8"))}
stimuli = {r["Stimulus"]: r for r in csv.DictReader(open(files["stimuli.csv"][0], encoding="utf-8"))}
out = []
for r in csv.DictReader(open(HERE / "lista.csv", encoding="utf-8")):
    if r["tipo"] != "molecule" or not r["cas"]:
        continue
    d, s = behavior.get(r["cas"]), stimuli.get(r["cas"], {})
    conc = s.get("Concentration %", "")
    if r["material_id"] not in commons:
        raise SystemExit(f"{r['nombre']}: {r['material_id']} no es un común")
    # La familia, solo si el común no la tiene: la primera palabra de la lista que la app sabe leer.
    fam = family(d.replace(";", " ")) if d and not commons[r["material_id"]]["family"] else None
    out.append({
        "n": r["n"], "material_id": r["material_id"], "nombre": r["nombre"], "cas": r["cas"], "descriptores": d or "", "familia": fam or "",
        "tgsc_id": s.get("TGSC ID", ""), "concentracion": conc, "disolvente": s.get("Solvent", ""),
        "fuente": (f"TGSC via Pyrfume, {RAW}behavior.csv (sha256 {files['behavior.csv'][1][:12]}): «{r['cas']},{d}»"
                   + (f"; stimuli.csv: TGSC ID {s.get('TGSC ID')}, smelled at {conc} %{' in ' + s['Solvent'] if s.get('Solvent') else ''}" if s else "")) if d else
                  f"no lo dice: {RAW}behavior.csv no tiene el CAS {r['cas']}",
    })
with open(HERE / "pyrfume-63.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(out[0]), lineterminator="\n"); w.writeheader(); w.writerows(out)
print(f"{sum(bool(o['descriptores']) for o in out)} de {len(out)} moléculas con descriptores")
