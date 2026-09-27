#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Relaciona cada molécula del glosario con las que IFRA sí lista, por su InChIKey.

Dos preguntas, sobre la misma cuenta:
- **¿Por qué un material del FIG no está en nada de IFRA?** A veces es el mismo compuesto
  con otro CAS, u otra estereoquímica de una molécula que IFRA sí lista.
- **¿Hay moléculas sin estándar que son la misma que una regulada?** Los estándares de IFRA
  cubren su sustancia «con cualquier CAS con que se la identifique», no solo los que
  listan. Una de esas moléculas hereda el estándar, salvo que la revisión diga lo contrario.

La InChIKey tiene tres bloques. Si coinciden los dos primeros, es el mismo compuesto. Si
solo coincide el primero, es la misma molécula (los mismos átomos, unidos igual) con otra
estereoquímica: un isómero óptico o geométrico, o la mezcla sin especificar.

Usa las cachés de PubChem de `datos/glosario/.cache/` (CID por CAS, e InChIKey por CID).
Escribe `datos/glosario/origen/equivalencias.csv`, que el generador del glosario lee.
Uso:  python scripts/relacionar_moleculas.py
"""
import csv
import json
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "datos" / "glosario" / ".cache"
OUT = ROOT / "datos" / "glosario" / "origen" / "equivalencias.csv"

# The review: a relation that must not carry a standard over, and why.
NO_INHERIT = {
    ("106-25-2", "106-24-1"): "El nerol es el isómero Z del geraniol, con identidad propia; el estándar de geraniol no lo cubre.",
}


def inchikeys(cids: list[int], known: dict[str, str]) -> dict[str, str]:
    """Fills the InChIKeys that are missing, 150 CIDs a request."""
    missing = [c for c in cids if str(c) not in known]
    for i in range(0, len(missing), 150):
        chunk = ",".join(str(c) for c in missing[i:i + 150])
        url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{chunk}/property/InChIKey/JSON"
        for wait in (2, 4, 8, 16):
            done = subprocess.run(["curl", "-s", "-m", "60", "-A", "perfumeria-app/0.1", "-w", "\n%{http_code}", url],
                                  capture_output=True, text=True, encoding="utf-8", errors="replace")
            body, _, code = done.stdout.rpartition("\n")
            if code == "200":
                for p in json.loads(body)["PropertyTable"]["Properties"]:
                    known[str(p["CID"])] = p.get("InChIKey", "")
                break
            time.sleep(wait)
        time.sleep(0.4)
    return known


def main() -> None:
    rows = list(csv.DictReader((ROOT / "datos" / "glosario" / "materiales.csv").open(encoding="utf-8")))
    synonyms = json.loads((CACHE / "pubchem.json").read_text(encoding="utf-8"))
    path = CACHE / "inchikey.json"
    known = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    known = inchikeys(sorted({c for v in synonyms.values() for c in v.get("cid", [])}), known)
    path.write_text(json.dumps(known), encoding="utf-8")

    def keys(cas: str) -> set[str]:
        return {known.get(str(c), "") for c in (synonyms.get(cas) or {}).get("cid", [])} - {""}

    molecules = {}
    for m in rows:
        if m["clase"] == "molécula" and m["cas"]:
            molecules.setdefault(m["cas"], m)
    in_ifra = {c for c, m in molecules.items() if any(f.startswith("ifra") for f in m["fuentes"].split())}
    regulated = {c for c, m in molecules.items() if m["estandares"]}
    by_full: dict[str, set[str]] = {}
    by_block: dict[str, set[str]] = {}
    for c in in_ifra:
        for k in keys(c):
            by_full.setdefault(k[:25], set()).add(c)
            by_block.setdefault(k[:14], set()).add(c)

    out = []
    for cas, m in sorted(molecules.items()):
        ks = keys(cas)
        same = sorted({o for k in ks for o in by_full.get(k[:25], set())} - {cas})
        iso = sorted({o for k in ks for o in by_block.get(k[:14], set())} - {cas} - set(same))
        fig_only = m["fuentes"] == "fig"
        for relation, others in (("mismo-compuesto", same), ("otra-estereoquimica", iso)):
            for other in others:
                inherit = not m["estandares"] and other in regulated
                if not (fig_only or inherit):
                    continue
                reason = NO_INHERIT.get((cas, other), "")
                key = next((k for k in ks if k[:14] == next(iter(keys(other)), "")[:14]), next(iter(ks), ""))
                out.append({"cas": cas, "cas_ifra": other, "relacion": relation,
                            "nombre_ifra": molecules[other]["nombre"],
                            "hereda": "sí" if inherit and not reason else "",
                            "motivo_no_hereda": reason if inherit else "",
                            "fuente": f"PubChem, InChIKey {key}"})
    with OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["cas", "cas_ifra", "relacion", "nombre_ifra", "hereda", "motivo_no_hereda", "fuente"],
                           lineterminator="\n")
        w.writeheader()
        w.writerows(out)
    print(f"{OUT.relative_to(ROOT).as_posix()}: {len(out)} relaciones; {sum(1 for r in out if r['hereda'])} heredan un estándar")


if __name__ == "__main__":
    main()
