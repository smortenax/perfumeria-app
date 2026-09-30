#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""C-002: constituents from the SDS and cross-check of the IFRA certificates (Perfumiarz).

Usage: c002_extraer.py TXT_DIR

TXT_DIR comes from c002_extraer_texto.py. Writes, in ../lotes/:
  C-002.csv            regulated constituents (IFRA standard) of naturals/mixtures, from SDS section 3
  C-002-sin-glosario.csv   same, for products with no glossary row (kept apart)
  X-001.csv            category 4 of each IFRA certificate vs the glossary state
  C-002-diagnostico.json   counts and lists the summary needs
No number is estimated: a value is written only when the document gives it and the
pairing CAS -> % is verifiable (same line, or equal counts paired by order, flagged).
"""
import csv, json, os, re, sys, collections
sys.path.insert(0, os.path.dirname(__file__))
from c002_lib import *

LOTES = os.path.join(REPO, "docs/investigacion/2026-09-30-usos-y-constituyentes/lotes")
COLS_C = ["material_id", "cas", "nombre", "constituyente", "cas_constituyente", "estandar_ifra", "min_pct", "max_pct",
          "tipo_valor", "fuente", "tipo_fuente", "url", "consultado", "cita", "notas"]
COLS_X = ["material_id", "cas", "nombre", "cat4_certificado", "url", "cita", "estado_glosario", "marca", "nota"]


# ---------------------------------------------------------------- certificates
NR = r"(?:no\s+restriction|not\s+restricted|unrestricted|no\s+limit)"


def _lim(g):
    return "no restringido" if f(g) >= 100 else "%s %%" % g.replace(".", ",")


def cat4(t):
    """Category 4 (IFRA 51: fine fragrance) of a certificate.

    Returns (valor, cita, formato) or (None, motivo, formato). valor is 'NN,NN %',
    'no restringido' or 'no cumple'. Only layouts where the number of the category and its
    limit sit together are read; the others are reported, not guessed.
    """
    one = lambda s: re.sub(r"\s+", " ", s).strip()[:170]
    if not re.search(r"\b51(st|th)?\b", t[:3500], re.I):
        return None, "el certificado no es de la 51.ª enmienda", "otra-enmienda"
    # Givaudan: table "Category 4   0.010   100.000" (finished product, fragrance oil)
    m = re.search(r"^[ \t]*Category\s+4[ \t]+(%s)[ \t]+%s[ \t]*$" % (NUM, NUM), t, re.M)
    if m and "Maximum level of use in" in t:
        return _lim(m.group(1)), one(m.group(0)), "givaudan-tabla"
    if re.search(r"no safety limits have been established", t, re.I) and re.search(r"Combined IFRA category", t):
        return "no restringido", "Givaudan: «no safety limits have been established» (ninguna categoría)", "givaudan-sin-limites"
    # Robertet / Payan: "Category : 4   0.60%"
    m = re.search(r"Category\s*:\s*4\b[ \t]+(%s)[ \t]*%%" % NUM, t)
    if m:
        return _lim(m.group(1)), one(m.group(0)), "robertet"
    # Takasago: "Class 4   20"
    m = re.search(r"Class\s*4\b[ \t]+(%s|Not compliant)" % NUM, t, re.I)
    if m and "IFRA" in t[:400]:
        g = m.group(1)
        if g.lower().startswith("not"):
            return "no cumple", one(m.group(0)), "takasago"
        return _lim(g), one(m.group(0)), "takasago"
    # IFF "IFRA 51 Standards Conformity Certificate": "4 Hydroalcoholic ... fine fragrance ... 40.0"
    m = re.search(r"^[ \t]*4[ \t]+Hydroalcoholic[^\n]*?(%s)[ \t]*$" % NUM, t, re.M)
    if m and "max in Fin" in t:
        return _lim(m.group(1)), one(m.group(0)), "iff-categorias"
    # Payan Bertrand: two columns "CATEGORIES LEVEL OF USE (%)"
    if re.search(r"CATEGORIES\s+LEVEL OF USE", t):
        m = re.search(r"^[ \t]*4[ \t]+(%s)[ \t]+(?:7A|7B|8|9|10A)[ \t]" % NUM, t, re.M)
        if m:
            return _lim(m.group(1)), one(m.group(0)), "payan-columnas"
    # Firmenich: rows "<n>   <product type>   <limit>". The product-type text is centred in tall
    # cells and the layout shifts lines, so a row is trusted only if EVERY category 1..11B of the
    # page has its own limit on the line of its number (a complete ladder = no shift).
    if "Level of use" in t and re.search(r"IFRA 51", t):
        i = t.index("Level of use")
        j = t.find("Disclaimer", i)
        blk = t[i: j if j > 0 else i + 4000]
        ladder = {}
        for m in re.finditer(r"^[ \t]*(1|2|3|4|5A|5B|5C|5D|6|7A|7B|8|9|10A|10B|11A|11B)[ \t]+(?:[^\n]*?[ \t]{2,})?(%s[ \t]*%%|No Restriction|Not Permitted|Prohibited)[ \t]*$" % NUM, blk, re.M | re.I):
            ladder.setdefault(m.group(1), m)
        need = ["1", "2", "3", "4", "5A", "5B", "5C", "5D", "6", "7A", "7B", "8", "9", "10A", "10B", "11A", "11B"]
        if all(k in ladder for k in need):
            g = ladder["4"].group(2)
            if re.match(r"Not Permitted|Prohibited", g, re.I):
                return "no cumple", one(ladder["4"].group(0)), "firmenich-filas"
            if re.match(r"No Restriction", g, re.I):
                return "no restringido", one(ladder["4"].group(0)), "firmenich-filas"
            return _lim(re.sub(r"[ %\t]", "", g)), one(ladder["4"].group(0)), "firmenich-filas"
        return None, "Firmenich: las filas de la tabla salen desalineadas (faltan límites en %d de 17 categorías)" % (17 - len([k for k in need if k in ladder])), "firmenich-desalineada"
    # Symrise "CLASS 4 - limited to : 0.51%"
    m = re.search(r"CLASS\s*4\s*-\s*limited to\s*:\s*(%s)\s*%%" % NUM, t, re.I)
    if m:
        return _lim(m.group(1)), one(m.group(0)), "class-limited"
    if "Application is" in t and re.search(r"Identity of the product", t):
        return None, "categorías combinadas de Symrise: la celda de categoría abarca varias filas", "symrise-combinadas"
    if re.search(r"IFRA 5\d Ingredients", t[:200]):
        return None, "IFF «Ingredients»: lista los restringidos y su %, sin límites por categoría", "iff-ingredients"
    if re.search(r"complies with the IFRA", t[:900], re.I) and len(t) < 1200:
        return None, "solo declara cumplimiento, sin límites", "solo-cumple"
    return None, "formato no leído", "otro"


def cert_num(v):
    m = re.match(r"([\d,]+) %", v)
    return f(m.group(1)) if m else None


def marca(v, estado):
    lim = cert_num(v) is not None or v == "no cumple"
    if lim and estado == "sin-estandar":
        return "discrepancia"
    if v == "no restringido" and estado == "con-techo":
        return "discrepancia"
    if lim and estado == "sin-dato":
        return "hueco"
    return "coincide"


# ---------------------------------------------------------------- main
def fmt(x):
    return "" if x is None else ("%g" % x)


def main(txtdir):
    pages, pdf_pages, mats, by_cas, name_idx, ifra = load_catalogue()
    docs = sorted(os.listdir(os.path.join(CACHE, "documentos")))
    diag = collections.defaultdict(list)
    cnt = collections.Counter()
    rowsC, rowsS, rowsX = [], [], []
    seen = set()
    order = sorted(docs, key=lambda d: (0 if "FDSu" in d else 1, d))
    for d in order:
        t = read_txt(txtdir, d)
        kind = classify(d, t)
        cnt["tipo:" + kind] += 1
        if kind == "imagen":
            diag["ilegibles"].append(d)
            continue
        if kind in ("alergenos", "otro"):
            diag[kind].append(d)
            continue
        pgs = pdf_pages.get(d, [])
        if not pgs:
            diag["sin-pagina"].append(d)
            continue
        targets = []
        for p in pgs:
            m, note = resolve_material(p, pages, by_cas, name_idx)
            targets.append((p, m, note))
        if kind == "ifra":
            v, cita, fmtc = cat4(t)
            cnt["ifra-formato:" + fmtc] += 1
            if v is None:
                diag["ifra-sin-cat4"].append("%s [%s: %s]" % (d, fmtc, cita))
                cnt["ifra:sin-cat4"] += 1
                continue
            cnt["ifra:con-cat4"] += 1
            propio = bool(re.search(r"Does not contain any substance restricted by IFRA|Bears no IFRA specification|IFF experts have derived internal safe", t, re.I))
            for p, m, note in targets:
                r = pages.get(p)
                estado = m["estado"] if m else ""
                key = ("X", d, m["id"] if m else p)
                if key in seen:
                    continue
                seen.add(key)
                rowsX.append({
                    "material_id": m["id"] if m else "", "cas": (m["cas"] if m else (r["cas"] if r else "")),
                    "nombre": (m["nombre"] if m else (r["nombre"] if r else p)), "cat4_certificado": v,
                    "url": "https://perfumiarz.com/products/" + p, "cita": "%s [%s]" % (cita, d),
                    "estado_glosario": estado or ("sin fila: " + note), "marca": marca(v, estado) if m else "sin-glosario",
                    "nota": ("el certificado dice que no lleva sustancias restringidas por IFRA o que el límite es de evaluación propia del proveedor: no es un estándar IFRA" if propio else "")})
            continue
        # ---- SDS
        cnt["sds"] += 1
        sec = section3(t)
        if sec is None:
            diag["sds-sin-seccion3"].append(d)
            continue
        for p, m, note in targets:
            r = pages.get(p)
            own = m["cas"] if m else (r["cas"] if r else "")
            clase = m["clase"] if m else (r["clase"] if r else "")
            rows, method, unres = constituents(sec, own)
            cas_all = set(cas_in("\n".join(sec)))
            if m is not None and clase == "molécula":
                cnt["sds:molecula-saltada"] += 1
                diag["sds-molecula"].append(d)
                continue
            if m is None and len(cas_all - {own}) == 0 and method != "no-alineable":
                cnt["sds:molecula-saltada(sin-glosario)"] += 1
                continue
            cnt["sds:natural-o-mezcla"] += 1
            if method == "no-alineable":
                diag["sds-no-alineable"].append(d)
                cnt["sds:no-alineable"] += 1
                continue
            cnt["sds:alineada-" + method] += 1
            got = 0
            for cas, pc, line in rows:
                if cas not in ifra or cas == own:
                    continue
                key = ("C", m["id"] if m else p, cas, pc[0], pc[1])
                if key in seen:
                    continue
                seen.add(key)
                got += 1
                names = by_cas.get(cas, [])
                nota = []
                if pc[2] == "rango":
                    nota.append("rango de la sección 3 de la SDS (banda de clasificación, no una medida)")
                if pc[0] == 0:
                    nota.append("el 0 es el borde de la banda, no una medida")
                if pc[2] == "máximo":
                    nota.append("la SDS da un tope («%s»), no un valor típico" % pc[3])
                if method == "orden-por-pagina":
                    nota.append("CAS y % emparejados por orden en la página (mismo número de CAS y de %; la tabla maqueta mal): comprobar contra el PDF")
                if m is None:
                    nota.append(note)
                row = {
                    "material_id": m["id"] if m else "", "cas": own, "nombre": (m["nombre"] if m else (r["nombre"] if r else p)),
                    "constituyente": names[0]["nombre"] if names else "", "cas_constituyente": cas,
                    "estandar_ifra": ";".join(ifra[cas]), "min_pct": fmt(pc[0]), "max_pct": fmt(pc[1]), "tipo_valor": pc[2],
                    "fuente": "Perfumiarz: SDS %s" % d, "tipo_fuente": "proveedor",
                    "url": "https://perfumiarz.com/products/" + p, "consultado": TODAY,
                    "cita": re.sub(r"\s+", " ", line)[:200], "notas": "; ".join(nota)}
                (rowsC if m else rowsS).append(row)
            if got:
                cnt["sds:natural-con-constituyentes"] += 1
                diag["naturales-con-constituyentes"].append(m["id"] if m else p)
            else:
                cnt["sds:natural-sin-regulados"] += 1
    for name, rows, cols in (("C-002.csv", rowsC, COLS_C), ("C-002-sin-glosario.csv", rowsS, COLS_C), ("X-001.csv", rowsX, COLS_X)):
        with open(os.path.join(LOTES, name), "w", encoding="utf-8", newline="\n") as fh:
            w = csv.DictWriter(fh, fieldnames=cols, lineterminator="\n")
            w.writeheader()
            w.writerows(rows)
    diag["_contadores"] = dict(cnt)
    diag["_filas"] = {"C-002": len(rowsC), "C-002-sin-glosario": len(rowsS), "X-001": len(rowsX)}
    diag["_marcas"] = collections.Counter(r["marca"] for r in rowsX)
    json.dump(diag, open(os.path.join(LOTES, "C-002-diagnostico.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(json.dumps({k: v for k, v in diag.items() if k.startswith("_")}, ensure_ascii=False, indent=1))
    for k, v in diag.items():
        if not k.startswith("_"):
            print(k, len(v))


if __name__ == "__main__":
    main(sys.argv[1])
