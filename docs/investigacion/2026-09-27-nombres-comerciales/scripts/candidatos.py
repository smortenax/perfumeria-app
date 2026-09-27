"""From PubChem synonyms, keep the ones that may be a usual or trade name, per CAS."""
import csv, json, re, sys, unicodedata
from pathlib import Path
APP = Path("C:/Users/SERGI/Claude/Projects/perfumeria-app")
ID = re.compile(r"^(\d{2,7}-\d{2}-\d|\d{3}-\d{3}-\d|(?=[A-Z0-9]*\d)[A-Z0-9]{10}|DTX[SC]ID|SCHEMBL\d|CHEMBL\d|CHEBI:|FEMA|NSC ?\d|MFCD\d|AKOS|ZINC\d|"
                r"(HY|CS|DB|BS|AC|AS|BP|FT|LS|KS|SR|DS|VS|SY|EN|BBL|STK|SMR|MLS|NCGC|BRN|AI3|CCRIS|HSDB|UN|EC|NS|PD|AB|AM|BDBM|GTPL|HMS|SEA|MSK|STR|EBC|SBB|PS|ST|SBI|CCG|orb|RefChem)[-_: ]?\d|"
                r"Tox21|EINECS|WLN|InChI|[A-Z]\d{3,}|Q\d+$|Maybridge|Epitope|starbld)")
SYSTEMATIC = re.compile(r"\d\s*[,'\-]|\d[a-z]?\s*\(|\[|\]|\(\s*[+\-±RSEZ]|\b(yl|oxy|ylidene)\b|,\s*\d|\b(ester|acid|ether|with|mixture|mixed|isomers?|reaction|product|solution|grade|tech|natural|synthetic)\b", re.I)
NOISE = re.compile(r"^UNII-|^[A-Z]{1,5}-[A-Z]{0,2}\d|^[A-Z]{14}-[A-Z]{8,10}(-[A-Z])?$|^[A-Za-z]{2,6}[-_ ]?\d{3,}\w*$|bmse\d|impurity|standard|>=|\bFCC\b|\bUSP\b|\bEP\b|\(VAN\)|caswell|\bEPA\b|\bcode\b|solvent|anhydrous|\bgrade\b|\bfor gc\b|;", re.I)
NUMBERED = re.compile(r"^(aldehyde|alcohol|acetate|lactone|ketone)\s*c[- ]?\d{1,2}", re.I)

def norm(t):
    t = unicodedata.normalize("NFD", t).encode("ascii", "ignore").decode().lower()
    t = re.sub(r"\balpha\b|\.alpha\.", "a", t)
    t = re.sub(r"\bbeta\b|\.beta\.", "b", t)
    return re.sub(r"[^a-z0-9]", "", t)

def candidates(synonyms, chemical):
    out, seen = [], {norm(chemical)}
    for s in synonyms:
        # «Karanal Solution in Methanol, 100ug/mL»: the name is the head.
        s = re.split(r"\s+solution\b", s.strip(), flags=re.I)[0].strip()
        if not s or len(s) > 40 or ID.match(s) and not NUMBERED.match(s):
            continue
        if SYSTEMATIC.search(s) and not NUMBERED.match(s) or NOISE.search(s):
            continue
        if len(s.split()) > 5:
            continue
        n = norm(s)
        if n in seen or not re.search(r"[A-Za-z]{2}", s):
            continue
        seen.add(n)
        out.append(s)
    return out[:15]

if __name__ == "__main__":
    cache = json.loads((APP / "datos/glosario/.cache/pubchem.json").read_text(encoding="utf-8"))
    rows = list(csv.DictReader((APP / "datos/glosario/materiales.csv").open(encoding="utf-8")))
    names = {}
    for r in rows:
        names.setdefault(r["cas"], r["nombre"])
    n_with = 0
    for cas, v in list(cache.items())[: int(sys.argv[1]) if len(sys.argv) > 1 else 40]:
        c = candidates(v.get("sinonimos", []), names.get(cas, ""))
        n_with += bool(c)
        print(cas, "|", names.get(cas, "")[:35], "=>", c)
    print("with candidates:", n_with)
