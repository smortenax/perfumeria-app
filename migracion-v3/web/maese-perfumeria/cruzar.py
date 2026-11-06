"""Cruce de los productos de perfumería de Maese Lab con PerfuMate y con lo común de la v3.

Lee:
  - lista.csv: los 556 productos (categoría, nombre en la web, URL), de los listados de maeselab.com
    del 2026-11-06 (tinturas: solo las del filtro «Apto para Perfumería: Sí»).
  - fichas/lote*.txt: la «Ficha técnica» de cada producto, copiada literal por lotes.
  - ../../perfumate/perfumate.sqlite3: PerfuMate, la misma copia que leyeron las tandas 21 y 43.
  - ../../../v3/datos/materials.csv: lo común de la v3 (para saber qué ya existe y con qué impacto).
Escribe cruce.csv. Determinista: dos pasadas dan lo mismo.

  python3 -I migracion-v3/web/maese-perfumeria/cruzar.py
"""
import csv
import glob
import json
import os
import re
import sqlite3
import unicodedata
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
PM = os.path.join(ROOT, "migracion-v3", "perfumate", "perfumate.sqlite3")
COMMON = os.path.join(ROOT, "v3", "datos", "materials.csv")

# Disolventes y soportes: su CAS en la ficha no identifica el material aromático.
SOLVENT_CAS = {
    "64-17-5": "etanol", "504-63-2": "propanodiol", "57-55-6": "propilenglicol",
    "25265-71-8": "DPG", "110-27-0": "IPM", "7732-18-5": "agua", "77-93-0": "TEC",
    "120-51-4": "benzoato de bencilo", "56-81-5": "glicerina", "8042-47-5": "aceite mineral",
    "61789-91-1": "jojoba", "8001-21-6": "girasol", "73398-61-5": "MCT", "65381-09-1": "MCT",
}
CAS_RE = re.compile(r"\b(\d{2,7})-(\d{2})-(\d)\b")


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def cas_ok(c: str) -> bool:
    digits = c.replace("-", "")
    body, check = digits[:-1], int(digits[-1])
    return sum((i + 1) * int(d) for i, d in enumerate(reversed(body))) % 10 == check


def cas_list(text: str):
    out = []
    for a, b, c in CAS_RE.findall(text or ""):
        cas = f"{int(a)}-{b}-{c}"
        if cas not in out:
            out.append(cas)
    return out


def kind_of(cat: str, h1: str, pureza: str, metodo: str) -> str:
    t = norm(" ".join([h1, pureza, metodo]))
    if cat == "tinturas-extractos":
        return "tintura"
    if re.search(r"\bdilucion\b|\bal \d+ ?\b|\d+ prop\b|\bprop \d+", t) and cat != "aroma-chemicals":
        return "dilucion"
    if cat == "aroma-chemicals":
        return "molecula"
    if "co2" in t:
        return "co2"
    if "resinoide" in t:
        return "resinoide"
    if "reduccion" in t or "red tintura" in t:
        return "reduccion"
    if "abs" in t.split() or "absoluto" in t or "concreto" in t:
        return "absoluto"
    return "aceite esencial"


def percent(text: str):
    """Porcentaje declarado de material aromático (dilución, pureza), si la ficha lo dice."""
    m = re.search(r"(?:al|dilucion[^0-9]{0,30}|pureza|purity)\s*(\d+(?:[.,]\d+)?)\s*%", norm_keep_pct(text))
    return m.group(1).replace(",", ".") if m else ""


def norm_keep_pct(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9%.,]+", " ", s)


FIELDS = ["n", "h1", "tipo", "metodo", "parte", "origen", "inci", "cas", "pureza", "cargas",
          "graduacion", "apto", "perfil", "nota"]


def read_fichas():
    fichas = {}
    for path in sorted(glob.glob(os.path.join(HERE, "fichas", "lote[0-9]*.txt"))):
        for line in open(path, encoding="utf-8"):
            line = line.rstrip("\n")
            if not line.strip() or line.startswith("FIN"):
                continue
            parts = [p.strip() for p in line.split(" ¦ ")]
            if len(parts) != len(FIELDS):
                raise SystemExit(f"{os.path.basename(path)}: {len(parts)} campos: {line[:80]}")
            rec = {k: ("" if v == "—" else v) for k, v in zip(FIELDS, parts)}
            fichas[rec["n"]] = rec
    return fichas


def load_perfumate():
    db = sqlite3.connect(PM)
    rows = db.execute(
        "SELECT slug, source_url, name, cas, impact, working_dilution, substantivity_text, synonyms_json, origin "
        "FROM materials").fetchall()
    by_cas, entries = defaultdict(list), []
    for slug, url, name, cas, impact, dil, subst, syn, origin in rows:
        e = {"name": name, "url": url, "impact": impact, "dil": dil or "", "subst": subst or "",
             "origin": origin or "", "names": {norm(name), *(norm(s) for s in json.loads(syn or "[]"))},
             "cas": cas_list(cas or "")}
        entries.append(e)
        for c in e["cas"]:
            by_cas[c].append(e)
    return entries, by_cas


def load_common():
    by_cas, by_name = defaultdict(list), {}
    with open(COMMON, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["owner_id"]:
                continue
            cs = cas_list(r["cas"]) + cas_list(r["other_cas"])
            for c in cs:
                by_cas[c].append(r)
            by_name[norm(r["name"])] = r
    return by_cas, by_name


PROCESS_WORDS = {
    "aceite esencial": ("essential oil", " oil"), "absoluto": ("absolute", "concrete"),
    "co2": ("co2",), "resinoide": ("resinoid",), "tintura": ("tincture", "infusion"),
    "reduccion": ("tincture", "infusion", "absolute"), "dilucion": ("absolute",),
}


def binomial(inci: str):
    words = norm(inci).split()
    stop = {"alcohol", "and", "extract", "oil", "leaf", "bark", "flower", "seed", "root", "wood",
            "fruit", "resin", "gum", "peel", "absolute", "herb", "propanediol", "water"}
    words = [w for w in words if w not in stop]
    return " ".join(words[:2]) if len(words) >= 2 else ""


def pick(cands, wanted_words, names):
    """Entre varias entradas de PerfuMate: la del mismo proceso y nombre; si siguen varias, todas."""
    if len(cands) <= 1:
        return cands
    by_name = [e for e in cands if e["names"] & names]
    if len(by_name) == 1:
        return by_name
    if not by_name:  # el nombre de PerfuMate, entero, dentro del de Maese («Ambroxan» en «Ambroxan Cristal»)
        inside = [e for e in cands if any(f" {n} " in f" {m} " for n in e["names"] if n for m in names)]
        if len(inside) == 1:
            return inside
        by_name = inside
    pool = by_name or cands
    by_proc = [e for e in pool if any(w in " " + norm(e["name"]) for w in wanted_words)]
    return by_proc or pool


def main():
    fichas = read_fichas()
    pm_entries, pm_cas = load_perfumate()
    common_cas, common_name = load_common()
    out = []
    with open(os.path.join(HERE, "lista.csv"), encoding="utf-8") as f:
        lista = list(csv.DictReader(f))
    for p in lista:
        fi = fichas.get(p["n"])
        row = {"n": p["n"], "categoria": p["categoria"], "nombre_web": p["nombre_web"], "url": p["url"]}
        if not fi or fi["h1"].startswith("ERROR"):
            row["estado"] = "sin ficha" if not fi else fi["h1"]
            out.append(row)
            continue
        kind = kind_of(p["categoria"], fi["h1"], fi["pureza"], fi["metodo"])
        all_cas = cas_list(fi["cas"])
        # Una molécula sola es lo que es aunque sirva de disolvente (benzoato de bencilo).
        solo = kind == "molecula" or len(all_cas) == 1
        aroma_cas = all_cas if solo else [c for c in all_cas if c not in SOLVENT_CAS]
        solvents = [] if solo else [SOLVENT_CAS[c] for c in all_cas if c in SOLVENT_CAS]
        bad = [c for c in all_cas if not cas_ok(c)]
        names = {norm(x) for x in (fi["h1"], fi["tipo"], fi["inci"], p["nombre_web"]) if x}
        words = PROCESS_WORDS.get(kind, ())
        how, cands = "", []
        for c in aroma_cas:
            cands += [e for e in pm_cas.get(c, []) if e not in cands]
        if cands:
            how = "cas"
            cands = pick(cands, words, names)
        else:
            byname = [e for e in pm_entries if e["names"] & names]
            if byname:
                how, cands = "nombre", pick(byname, words, names)
            else:
                b = binomial(fi["inci"])
                if b and kind != "molecula":
                    bysp = [e for e in pm_entries if e["origin"] == "natural"
                            and any(b in n for n in e["names"] | {norm(e["name"])})]
                    if bysp:
                        how, cands = "especie", pick(bysp, words, names)
        impacts = sorted({e["impact"] for e in cands if e["impact"] is not None})
        com = []
        for c in aroma_cas:
            com += [r for r in common_cas.get(c, []) if r not in com]
        row.update({
            "estado": "ok", "tipo": kind, "h1": fi["h1"], "inci": fi["inci"], "cas_web": fi["cas"],
            "cas": " ".join(aroma_cas), "cas_disolvente": " ".join(solvents),
            "cas_check": "mal: " + " ".join(bad) if bad else ("" if all_cas else "sin CAS"),
            "pureza": fi["pureza"], "pct_declarado": percent(" ".join([fi["h1"], fi["pureza"], fi["nota"]])),
            "cargas": fi["cargas"], "graduacion": fi["graduacion"], "apto": fi["apto"],
            "nota_web": fi["nota"],
            "pm_como": how, "pm_n": len(cands),
            "pm_nombres": " | ".join(f"{e['name']} ({e['impact']})" for e in cands[:6]),
            "pm_url": cands[0]["url"] if len(cands) == 1 else "",
            "pm_impacto": str(impacts[0]) if len(impacts) == 1 else "",
            "pm_rango": f"{impacts[0]}-{impacts[-1]}" if len(impacts) > 1 else "",
            "pm_dilucion": cands[0]["dil"] if len(cands) == 1 else "",
            "pm_tira": cands[0]["subst"] if len(cands) == 1 else "",
            "comun": " | ".join(r["name"] for r in com[:3]),
            "comun_impacto": " | ".join(r["impact"] or "—" for r in com[:3]),
        })
        out.append(row)
    cols = ["n", "categoria", "nombre_web", "url", "estado", "tipo", "h1", "inci", "cas_web", "cas",
            "cas_disolvente", "cas_check", "pureza", "pct_declarado", "cargas", "graduacion", "apto",
            "nota_web", "pm_como", "pm_n", "pm_nombres", "pm_url", "pm_impacto", "pm_rango",
            "pm_dilucion", "pm_tira", "comun", "comun_impacto"]
    with open(os.path.join(HERE, "cruce.csv"), "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, cols, lineterminator="\n")
        w.writeheader()
        for r in out:
            w.writerow({k: r.get(k, "") for k in cols})
    ok = [r for r in out if r.get("estado") == "ok"]
    print(f"{len(out)} productos, {len(ok)} con ficha")
    print("PerfuMate:", {k: sum(r['pm_como'] == k for r in ok) for k in ("cas", "nombre", "especie", "")})
    print("impacto único:", sum(bool(r["pm_impacto"]) for r in ok), "rango:", sum(bool(r["pm_rango"]) for r in ok))
    print("ya en lo común:", sum(bool(r["comun"]) for r in ok))


if __name__ == "__main__":
    main()
