"""Tanda 64: los documentos de fuera (ifra-fuera.csv: el certificado IFRA, la declaración de alérgenos o la
SDS del mismo producto, públicos en otra web, para los productos cuyo certificado no publica Perfumiarz),
bajados y leídos por script con las reglas de info-18-nov/extraer.py (tanda 60), de donde sale este código.

    python3 -I migracion-v3/web/info-64/documentos.py <carpeta-caché>   → documentos-64.csv

Los PDF quedan en la caché (no entran en Git, V3-21).
"""
import csv, re, subprocess, sys, time, urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
CACHE = Path(sys.argv[1]); CACHE.mkdir(parents=True, exist_ok=True)
OUT = HERE / "documentos-64.csv"
lista = {r["n"]: r for r in csv.DictReader(open(HERE / "lista.csv", encoding="utf-8"))}
fuera = [r for r in csv.DictReader(open(HERE / "ifra-fuera.csv", encoding="utf-8")) if r["url"].strip()]
KIND = {"ifra": "ifra", "alergenos": "eu_allergens", "sds": "sds"}
fichas, docs = {}, []
for i, r in enumerate(fuera):
    x = lista[r["n"]]
    key = f"{r['n']}.{i}"
    fichas[key] = {"producto": x["producto"], "inci": "", "titulo": x["nombre"], "cas": x["cas"], KIND[r["tipo"]]: r["url"].strip(), "emisor": r["emisor"]}
    pdf = CACHE / f"{key}-{KIND[r['tipo']]}.pdf"
    if not pdf.exists():
        req = urllib.request.Request(r["url"].strip(), headers={"User-Agent": "Mozilla/5.0 (research script)"})
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                pdf.write_bytes(resp.read())
        except Exception as e:  # noqa: BLE001
            print(f"{key}: no baja ({e})"); continue
        time.sleep(0.5)
    if not pdf.with_suffix(".txt").exists():
        subprocess.run(["pdftotext", "-layout", str(pdf), str(pdf.with_suffix(".txt"))], check=False)

CAS = r"(?<![\d-])(\d{2,7}-\d{2}-\d)(?![\d-])"
NUM = r"\d+(?:[.,]\d+)?"


def cas_ok(c):
    digits = c.replace("-", "")
    body, check = digits[:-1], int(digits[-1])
    return sum(int(d) * (i + 1) for i, d in enumerate(reversed(body))) % 10 == check


def cases(s):
    return [c for c in re.findall(CAS, s) if cas_ok(c)]


def f(s):
    return float(s.replace(",", "."))


def words(s):
    s = s.lower()
    for k, v in SAME.items():
        s = s.replace(k, v)
    return {w for w in re.findall(r"[a-z]{3,}", s.lower()) if w not in {"oil", "base", "bold", "the", "dpg", "ipm", "tec", "natural", "crystals", "powder"}}


PRODUCT = re.compile(r"(?:^\s*PRODUCT\s*:|Trade name\s*:|Product(?: Name| name)?\s*:?|Produit / Product\s*:|Substance name\s*:|Identity of the product: Name\s*:|Identyfikacja preparatu\s*:)\s+(.+?)(?:\s{2,}|$)")
# Nombres que el fabricante escribe en su idioma (lectura de la sesión): el mismo producto.
SAME = {"cafe absolue": "coffee absolute", "tuyopseno": "thujopsene", "ethyllinalool": "ethyl linalool", "cryst": "crystals"}
HEADER = re.compile(r"This (?:document|data sheet) (?:replaces|cancels)|We certify that the ingredient below|^Product Information$|^\d:Product Information$")


def products_of(text):
    """Los nombres de producto que da el documento (todos los candidatos, en orden)."""
    found = []
    for line in text.splitlines()[:200]:
        m = PRODUCT.search(line)
        if m and re.search(r"[A-Za-z]{3}", m.group(1)) and not re.search(r"information|number|identifier|indicated|^type$|^code|intended|criteria", m.group(1), re.I):
            found.append(m.group(1).strip())
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    for i, l in enumerate(lines[:40]):  # la línea que sigue a «This document replaces…» (Firmenich), «We certify…» (Robertet), «Product Information» (DSM)
        if HEADER.search(l) and i + 1 < len(lines):
            found.append(re.sub(r"\s+\d{5,}.*$", "", lines[i + 1 + (1 if lines[i + 1].startswith("Product Code") else 0)]))
    found += lines[:15]  # la cabecera del documento, donde la casa pone el nombre de su producto
    return found


rows = []


def add(n, kind, page, product, line, **kw):
    rows.append({"n": n.split(".")[0], "documento": kind, "url": fichas[n][kind if kind != "alergenos" else "eu_allergens"], "emisor": fichas[n]["emisor"], "pagina": page,
                 "producto_doc": product, **{k: kw.get(k, "") for k in ("campo", "cas", "nombre", "tipo", "valor", "min", "max", "unidad", "estado")},
                 "frase": re.sub(r"\s+", " ", line).strip()})


def pages(text):
    return [(i + 1, p) for i, p in enumerate(text.split("\f"))]


def allergens(n, text, product):
    per_mgkg = bool(re.search(r"mg\s*/\s*kg", text)) and not re.search(r"\d\s*%", text)
    for page, p in pages(text):
        lines = p.splitlines()
        for i, line in enumerate(lines):
            here = cases(line)
            below = cases(lines[i + 1]) if i + 1 < len(lines) and re.match(r"\s*CAS#", lines[i + 1]) else []
            if not here and not below:
                m = re.match(rf"\s*([A-Za-z][A-Za-z -]+?)\s+Max\.?\s*({NUM})\s*%", line)
                if m:
                    add(n, "alergenos", page, product, line, campo="componente", cas="", nombre=m.group(1).strip(), tipo="max", max=m.group(2), unidad="%")
                continue
            if re.match(r"\s*CAS#", line):
                continue
            rest = re.sub(CAS, " ", line)
            vals = re.findall(rf"([<≤]\s*)?({NUM})\s*(%|mg\s*/\s*kg|ppm)?", re.sub(r"^\s*(?:III|V)\s*/\s*[\d, V/]+", " ", rest))
            vals = [v for v in vals if re.search(r"[.,]", v[1]) or v[2]]  # una cifra con decimales o unidad; no un número de anexo
            if not vals:
                continue
            lt, v, unit = vals[-1]
            name = re.sub(r"\(CAS:?\s*\)|CAS#?:?|[<≤]|\d+(?:[.,]\d+)?\s*(?:%|mg\s*/\s*kg|ppm)?|-{2,}|\s-\s", " ", rest)
            name = re.sub(r"^\s*(?:III|V)\s*/\s*[\d, ]+|\b(?:AND|n\.d\.)\b|[;/()]", " ", name)
            name = re.sub(r"\s+", " ", name).strip(" -,")
            unit = "mg/kg" if (unit and "mg" in unit) or unit == "ppm" or (not unit and per_mgkg) else "%"
            context = line + ("  " + lines[i + 1].strip() if below else "")
            add(n, "alergenos", page, product, context, campo="componente", cas=(here or below)[0], nombre=name,
                tipo="max" if lt else "exact", valor="" if lt else v, max=v if lt else "", unidad=unit)


RANGE = re.compile(rf"[≥>]\s*({NUM})\s*%?\s*(?:-|–|;)\s*[<≤]\s*({NUM})\s*%?|({NUM})\s*(?:-|–)\s*({NUM})\s*%|[<≤]\s*({NUM})\s*%|(\d+,\d\d)\s*-\s*(\d+,\d\d)(?!\S)|(?<![\d,])(\d+,\d{{3}})\s*-\s*(\d+(?:,\d{{3}})?)(?!\S)")


def sds(n, text, product):
    m = re.search(r"(SEKCJA|SECTION|Section|RUBRIQUE|SECCI[OÓ]N)\s*:?\s*0?3\b|^\s*3\.\s*(COMPOSITION|Composition)", text, re.M)
    if not m:
        return
    start = m.start()
    e = re.search(r"(SEKCJA|SECTION|Section|RUBRIQUE|SECCI[OÓ]N)\s*:?\s*0?4\b|^\s*4\.\s*(FIRST|First)", text[start:], re.M)
    sec = text[start:start + e.start()] if e else text[start:start + 8000]
    page0 = text[:start].count("\f") + 1
    lines = sec.splitlines()
    concs, cas_at = [], []
    for i, line in enumerate(lines):
        clean = re.sub(r"\b\d{3}-\d{3}-\d\b|01-\d{6,}-\d+(?:-X+)?|\d{3}-\d{3}-\d{2}-\d|Index:\S+", " ", line)  # EC, REACH, índice
        for c in cases(clean):
            cas_at.append((i, c))
        for r in RANGE.finditer(clean):
            concs.append((i, r))
    used = set()
    for i, r in concs:
        dist = sorted(((abs(j - i), j, c) for j, c in cas_at if c not in used), key=lambda x: x[0])
        if not dist:
            continue
        state = "revisar" if len(dist) > 1 and dist[0][0] == dist[1][0] and dist[0][2] != dist[1][2] else ""
        _, j, c = dist[0]
        if dist[0][0] > 2:
            state = "revisar"
        used.add(c)
        lo, hi = next(((r.group(a), r.group(b)) for a, b in ((1, 2), (3, 4), (6, 7), (8, 9)) if r.group(a)), (None, r.group(5)))
        block = "  ".join(l.strip() for l in lines[min(i, j):max(i, j) + 1])
        page = page0 + "\f".join(lines[:i]).count("\f")
        add(n, "sds", page, product, block, campo="componente", cas=c, nombre="", tipo="range" if lo else "max",
            min=lo or "", max=hi, unidad="%", estado=state)


def restricted(n, text, product):
    """Biolandes: «RESTRICTED MATERIAL(S) …» then «Name   CAS   %» rows, up to «PROHIBITED MATERIAL(S)»."""
    for page, p in pages(text):
        on = False
        for line in p.splitlines():
            if "RESTRICTED MATERIAL(S)" in line:
                on = True; continue
            if "PROHIBITED MATERIAL(S)" in line:
                on = False; continue
            m = on and re.match(rf"\s*(\S.*?)\s{{2,}}((?:\d{{2,7}}-\d\d-\d)(?:\s*/\s*\d{{2,7}}-\d\d-\d)*)\s+({NUM})\s*$", line)
            if m and cases(m.group(2)):
                add(n, "ifra", page, product, line, campo="componente", cas=cases(m.group(2))[0], nombre=m.group(1).strip(), tipo="exact", valor=m.group(3), unidad="%")


def ifra(n, text, product):
    restricted(n, text, product)
    for page, p in pages(text):
        if re.search(r"RESTRICTED MATERIAL\(S\).*\n\s*None / Aucune", p):
            add(n, "ifra", page, product, "RESTRICTED MATERIAL(S) / MATIERE(S) RESTREINTE(S) None / Aucune", campo="ninguna_restringida", estado="el certificado no declara sustancias restringidas")
    """The category 4 line in the layouts of these certificates: «IFRA Category 4 … Not restricted» (Youwish),
    «4  Products related to fine fragrance / … 0,730» (Biolandes, the figure at the end, in %), «4  No
    Restriction» (Lluch); and IFF's «No substances to declare» (nothing restricted in the product)."""
    for page, p in pages(text):
        for line in p.splitlines():
            m = (re.match(r"\s*(?:IFRA\s+)?Category\s+4\b.*?\s(No Restriction|Not restricted|({NUM})\s*%)\s*$".replace("{NUM}", NUM), line, re.I)
                 or re.match(r"\s*4\s+(?:Products related to fine fragrance.*?\s)?(No Restriction|Not restricted|({NUM})\s*%?)\s*$".replace("{NUM}", NUM), line, re.I))
            if m:
                add(n, "ifra", page, product, line, campo="tope_cat4", valor=m.group(2) or "", unidad="%",
                    estado="" if m.group(2) else "sin restricción")
                return
        for line in p.splitlines():
            if re.match(r"\s*No substances to declare\s*$", line):
                add(n, "ifra", page, product, line, campo="tope_cat4", valor="", unidad="%", estado="sin restricción (no declara sustancias restringidas)")
                return


for txt in sorted((p for p in CACHE.glob("*.txt") if p.stem.split("-")[0] in fichas), key=lambda p: (float(p.stem.split("-")[0]), p.stem)):
    n, kind = txt.stem.split("-", 1)
    text = txt.read_text(encoding="utf-8", errors="replace")
    url_kind = {"eu_allergens": "alergenos"}.get(kind, kind)
    if len(text.strip()) < 50:
        add(n, url_kind, "", "", "el PDF no tiene texto (escaneado): no se lee", campo="sin_texto")
        continue
    shop = fichas[n]["producto"]
    cands = products_of(text)
    shop_words = words(shop + " " + fichas[n]["inci"] + " " + fichas[n]["titulo"])
    matching = [c for c in cands if words(c) & shop_words]
    product = matching[0] if matching else (cands[0] if cands else "")
    same = bool(matching)
    shop_cas = [c for c in cases(fichas[n]["cas"])]
    by_cas = bool(shop_cas) and all(c in text for c in shop_cas)
    add(n, url_kind, "1", product, f"producto del documento: «{product or 'no lo dice'}»; producto de la tienda: «{shop}»"
        + (f"; el documento da el CAS de la tienda, {', '.join(shop_cas)}" if by_cas else ""),
        campo="producto", estado="coincide" if same else "coincide por CAS" if by_cas else "no coincide")
    if kind == "eu_allergens":
        allergens(n, text, product)
    elif kind == "sds":
        sds(n, text, product)
    elif kind == "ifra":
        ifra(n, text, product)

with open(OUT, "w", encoding="utf-8", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0]), lineterminator="\n")
    w.writeheader(); w.writerows(rows)
print(f"{len(rows)} filas; {sum(r['campo'] == 'componente' for r in rows)} componentes; "
      f"{sum(r['estado'] == 'no coincide' for r in rows)} documentos de otro producto (o sin nombre); {sum(r['estado'] == 'revisar' for r in rows)} a revisar")
