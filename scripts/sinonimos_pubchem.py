#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Los sinónimos de PubChem que sirven para buscar, por CAS.

PubChem da cientos de sinónimos por molécula: nombres de uso («Diphenyl oxide»), nombres
sistemáticos y códigos de catálogo. Para el buscador sirven los primeros. Este script aplica
el filtro que eligió los candidatos de los nombres comerciales (P38): quita códigos,
números de registro y nombres sistemáticos largos, y deja hasta 20 nombres por CAS. Los
nombres químicos cortos se quedan, porque es como se teclean: «4-Ethylphenol» (P52).

Lee la caché de `scripts/buscar_sinonimos.py` (`datos/glosario/.cache/pubchem.json`, fuera de
Git) y escribe `datos/glosario/origen/sinonimos-pubchem.csv`, que sí va en Git: así el
glosario se regenera sin red. Los datos de PubChem son de uso libre.
Uso:  python scripts/sinonimos_pubchem.py
"""
import csv
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "datos" / "glosario" / ".cache" / "pubchem.json"
OUT = ROOT / "datos" / "glosario" / "origen" / "sinonimos-pubchem.csv"

# The filter of the trade-name candidates (docs/investigacion/2026-09-27-nombres-comerciales/scripts/candidatos.py).
ID = re.compile(r"^(\d{2,7}-\d{2}-\d|\d{3}-\d{3}-\d|(?=[A-Z0-9]*\d)[A-Z0-9]{10}|DTX[SC]ID|SCHEMBL\d|CHEMBL\d|CHEBI:|FEMA|NSC ?\d|MFCD\d|AKOS|ZINC\d|"
                r"(HY|CS|DB|BS|AC|AS|BP|FT|LS|KS|SR|DS|VS|SY|EN|BBL|STK|SMR|MLS|NCGC|BRN|AI3|CCRIS|HSDB|UN|EC|NS|PD|AB|AM|BDBM|GTPL|HMS|SEA|MSK|STR|EBC|SBB|PS|ST|SBI|CCG|orb|RefChem)[-_: ]?\d|"
                r"Tox21|EINECS|WLN|InChI|[A-Z]\d{3,}|Q\d+$|Maybridge|Epitope|starbld)")
SYSTEMATIC = re.compile(r"\d\s*[,'\-]|\d[a-z]?\s*\(|\[|\]|\(\s*[+\-±RSEZ]|\b(yl|oxy|ylidene)\b|,\s*\d|\b(ester|acid|ether|with|mixture|mixed|isomers?|reaction|product|solution|grade|tech|natural|synthetic)\b", re.I)
NOISE = re.compile(r"^UNII-|^[A-Z]{1,5}-[A-Z]{0,2}\d|^[A-Z]{14}-[A-Z]{8,10}(-[A-Z])?$|^[A-Za-z]{2,6}[-_ ]?\d{3,}\w*$|bmse\d|impurity|standard|>=|\bFCC\b|\bUSP\b|\bEP\b|\(VAN\)|caswell|\bEPA\b|\bcode\b|solvent|anhydrous|\bgrade\b|\bfor gc\b|;", re.I)
NUMBERED = re.compile(r"^(aldehyde|alcohol|acetate|lactone|ketone)\s*c[- ]?\d{1,2}", re.I)


def norm(text: str) -> str:
    text = unicodedata.normalize("NFD", text).encode("ascii", "ignore").decode().lower()
    text = re.sub(r"\balpha\b|\.alpha\.", "a", text)
    text = re.sub(r"\bbeta\b|\.beta\.", "b", text)
    return re.sub(r"[^a-z0-9]", "", text)


def usable(synonyms: list[str], known: set[str]) -> list[str]:
    out, seen = [], set(known)
    for s in synonyms:
        # «Karanal Solution in Methanol, 100ug/mL»: the name is the head.
        s = re.split(r"\s+solution\b", s.strip(), flags=re.I)[0].strip()
        if not s or len(s) > 40 or ID.match(s) and not NUMBERED.match(s):
            continue
        # A short chemical name with its numbers is how one types it («4-Ethylphenol»,
        # «2-Phenylethanol»), and stays; a long one, with brackets or commas, does not (P52).
        short = len(s) <= 24 and len(s.split()) <= 2 and not re.search(r"[\[\](),;]", s)
        if SYSTEMATIC.search(s) and not NUMBERED.match(s) and not short or NOISE.search(s):
            continue
        if len(s.split()) > 5:
            continue
        n = norm(s)
        if n in seen or not re.search(r"[A-Za-z]{2}", s):
            continue
        seen.add(n)
        out.append(s)
    return out[:20]


def main() -> None:
    cache = json.loads(CACHE.read_text(encoding="utf-8"))
    rows = list(csv.DictReader((ROOT / "datos" / "glosario" / "materiales.csv").open(encoding="utf-8")))
    # What the glossary already calls each CAS is not repeated.
    known: dict[str, set[str]] = {}
    for m in rows:
        names = [m["nombre"], m["nombre_comercial"], *m["otros_nombres_comerciales"].split(" | "), *m["sinonimos"].split(" | ")]
        known.setdefault(m["cas"], set()).update(norm(n) for n in names if n)
    out = []
    for cas in sorted(cache):
        names = usable((cache[cas] or {}).get("sinonimos", []), known.get(cas, set()))
        if names and cas in known:
            out.append({"cas": cas, "sinonimos": " | ".join(names)})
    with OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["cas", "sinonimos"], lineterminator="\n")
        w.writeheader()
        w.writerows(out)
    print(f"{OUT.relative_to(ROOT).as_posix()}: {len(out)} CAS, {sum(r['sinonimos'].count(' | ') + 1 for r in out)} nombres")


if __name__ == "__main__":
    main()
