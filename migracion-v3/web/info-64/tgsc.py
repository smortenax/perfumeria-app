"""Tanda 64: lo que dice la ficha de TGSC de cada material de lista.csv, leído por script (sin lector).

    python3 -I migracion-v3/web/info-64/tgsc.py <stimuli.csv de Pyrfume> [ids-naturales.csv]   → web-64-tgsc.csv

TGSC vuelve a responder a las lecturas automáticas (2026-11-22; daba 403 en las tandas 60 a 62). El id de la
ficha de una molécula sale de Pyrfume (goodscents/stimuli.csv, por CAS exacto); el de un natural, de
ids-naturales.csv (n, url), que se apunta a mano tras comprobar especie y forma. La página se baja con
info-61/pagina.py (caché fuera de Git), y cada fila cita la frase tal como sale en su texto.
Una molécula cuya ficha da otro CAS no se lee.
"""
import csv, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "info-61"))
from pagina import fetch, text_of  # noqa: E402

lista = list(csv.DictReader(open(HERE / "lista.csv", encoding="utf-8")))
stimuli = {}
for r in csv.DictReader(open(sys.argv[1], encoding="utf-8")):
    stimuli.setdefault(r["Stimulus"], r["TGSC ID"])
naturals = {}
if len(sys.argv) > 2:
    naturals = {r["n"]: r["url"] for r in csv.DictReader(open(sys.argv[2], encoding="utf-8"))}

rows = []
add = lambda n, nombre, campo, valor, url, frase, nota="": rows.append(
    {"n": n, "nombre": nombre, "campo": campo, "valor": valor, "fuente": f"TGSC, {url}: «{frase}»", "nota": nota})
for x in lista:
    n, name = x["n"], x["nombre"]
    if x["tipo"] == "molecule" and x["cas"] in stimuli:
        url = f"https://www.thegoodscentscompany.com/data/rw{stimuli[x['cas']]}.html"
    elif n in naturals:
        url = naturals[n]
    else:
        continue
    lines = text_of(fetch(url)).split("\n")
    if lines and lines[0].startswith("<!-- HTTP"):
        print(f"{n} {name}: {url} no carga"); continue
    nxt = lambda i: lines[i + 1] if i + 1 < len(lines) else ""
    if x["tipo"] == "molecule":
        cas_here = {nxt(i).strip() for i, l in enumerate(lines) if l.strip() == "CAS Number:"}
        if x["cas"] not in cas_here:
            rows.append({"n": n, "nombre": name, "campo": "cas", "valor": "", "fuente": f"TGSC, {url}", "nota": f"otro CAS: la ficha da {sorted(cas_here)}"})
            continue
    seen = set()
    for i, l in enumerate(lines):
        once = lambda k: not (k in seen or seen.add(k))
        if m := re.match(r"Odor Type: (.+)", l):
            once("familia") and add(n, name, "familia", m.group(1).strip(), url, l)
        elif m := re.match(r"Odor Strength: (.+)", l):
            once("fuerza") and add(n, name, "fuerza", m.group(1).strip(" ,"), url, l)
        elif m := re.match(r"Substantivity: (\d+(?:\.\d+)?) hour\(s\) at (\d+(?:\.\d+)?) %", l):
            if once("horas"):
                pure = float(m.group(2)) == 100
                add(n, name, "horas", m.group(1), url, l, "" if pure else f"diluido al {m.group(2)} %")
        elif re.match(r"Recommendation for .* usage levels up to:", l) and "fragrance concentrate" in nxt(i):
            once("dosis") and add(n, name, "dosis", nxt(i).strip(), url, f"{l} {nxt(i)}".strip())
        elif l.startswith("Odor Description:") and once("olor"):
            text = l[len("Odor Description:"):].strip()
            text = re.sub(r"^at \d+(?:\.\d+)? %(?: in [a-z ]+)?\.\s*", "", text)
            if text:
                add(n, name, "olor", text, url, l)
        elif l.strip() in ("Appearance:", "Specific Gravity:", "Soluble in:", "Insoluble in:", "Molecular Weight:", "Formula:",
                           "Vapor Pressure:", "Melting Point:", "Flash Point:") and nxt(i) and not nxt(i).endswith(":"):
            key = l.strip()[:-1].lower()
            once(key) and add(n, name, key, nxt(i).strip(), url, f"{l.strip()} {nxt(i).strip()}")
out = HERE / "web-64-tgsc.csv"
with open(out, "w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=["n", "nombre", "campo", "valor", "fuente", "nota"], lineterminator="\n"); w.writeheader(); w.writerows(rows)
read = {r["n"] for r in rows if r["valor"]}
print(f"{len(rows)} filas de {len(read)} materiales → {out.name}")
