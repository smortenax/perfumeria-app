"""Tanda 60: lo que dicen los documentos del fabricante que enlaza Perfumiarz (bajar.py), leído por script.

    python3 -I migracion-v3/web/info-18-nov/extraer.py <carpeta-caché>   → documentos.csv

Para cada documento de texto (`pdftotext -layout`):
- el producto que nombra el documento (para comprobar que es el de la página: Perfumiarz enlaza a veces el
  de otro producto), y si coincide con el nombre de la tienda;
- alérgenos UE: cada fila con un CAS y una cifra (en %, o en mg/kg); «-», «n.d.», «Not detected» no se
  escriben (no declarar un alérgeno no es un cero);
- SDS, sección 3: cada concentración («≥ 1 - < 2.5 %», «≥10; <25», «< 5 %») con el CAS más cercano;
  si dos CAS quedan a la misma distancia, la fila se marca «revisar» y no se usa;
- certificado IFRA: la cifra de la categoría 4 (tope del fabricante para su producto, no un límite de IFRA).

Cada fila lleva la página y la línea literal del documento. Un PDF sin texto (escaneado) se lista como tal.
"""
import csv, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
FICHAS = HERE.parent / "perfumiarz-pedido-18-nov" / "fichas.csv"
CACHE = Path(sys.argv[1])
OUT = HERE / "documentos.csv"

CAS = r"(?<![\d-])(\d{2,7}-\d{2}-\d)(?![\d-])"
NUM = r"\d+(?:[.,]\d+)?"
fichas = {r["n"]: r for r in csv.DictReader(open(FICHAS, encoding="utf-8"))}


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
    rows.append({"n": n, "documento": kind, "url": fichas[n][kind if kind != "alergenos" else "eu_allergens"], "pagina": page,
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


RANGE = re.compile(rf"[≥>]\s*({NUM})\s*%?\s*(?:-|–|;)\s*[<≤]\s*({NUM})\s*%?|({NUM})\s*(?:-|–)\s*({NUM})\s*%|[<≤]\s*({NUM})\s*%|(\d+,\d\d)\s*-\s*(\d+,\d\d)(?!\S)")


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
        lo, hi = next(((r.group(a), r.group(b)) for a, b in ((1, 2), (3, 4), (6, 7)) if r.group(a)), (None, r.group(5)))
        block = "  ".join(l.strip() for l in lines[min(i, j):max(i, j) + 1])
        page = page0 + "\f".join(lines[:i]).count("\f")
        add(n, "sds", page, product, block, campo="componente", cas=c, nombre="", tipo="range" if lo else "max",
            min=lo or "", max=hi, unidad="%", estado=state)


def ifra(n, text, product):
    for page, p in pages(text):
        for line in p.splitlines():
            m = re.match(r"\s*(?:Category\s+4|4)\s+(?:Products related to fine fragrance\s+|Hydroalcoholic.*?for\s+)?(No Restriction|Not restricted|({NUM})\s*%?)".replace("{NUM}", NUM), line)
            if m:
                add(n, "ifra", page, product, line, campo="tope_cat4", valor="" if not m.group(2) else m.group(2), unidad="%",
                    estado="sin restricción" if not m.group(2) else "")
                return


for txt in sorted(CACHE.glob("*.txt"), key=lambda p: (int(p.stem.split("-")[0]), p.stem)):
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
