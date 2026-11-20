"""
The 55 products of the Perfumiarz order of 2026-11-18 (bandeja del laboratorio, 2B), read from
perfumiarz.pl: for each one, the product the shop's search finds, and the literal text of its
«Dane Techniczne» panel (CAS, INCI, note, form, manufacturer, strength) and the links of its
documents (SDS, IFRA, EU allergens, CoA). It writes only what the page says, with its URL; the
pages are kept in cache/ so a second run gives the same bytes without asking the shop again.

    python3 -I migracion-v3/web/perfumiarz-pedido-18-nov/leer.py   → fichas.csv
"""
import csv
import html
import os
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cache")
BASE = "https://perfumiarz.pl"
os.makedirs(CACHE, exist_ok=True)


def get(path: str) -> str:
    key = re.sub(r"[^a-z0-9]+", "-", path.lower()).strip("-")[:150] + ".html"
    file = os.path.join(CACHE, key)
    if os.path.exists(file):
        with open(file, encoding="utf-8") as f:
            return f.read()
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "Mozilla/5.0 (research script)"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            text = r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        if e.code != 404:
            raise
        text = ""  # a link of the search that no longer has a page: kept empty, so it is not asked again
    with open(file, "w", encoding="utf-8") as f:
        f.write(text)
    time.sleep(1.0)
    return text


def fold(text: str) -> str:
    t = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9%]+", " ", t).strip()


# The words of a name that tell products apart (not the shop's decorations).
NOISE = {"oil", "natural", "the", "of", "and"}


def words(text: str) -> set:
    return {w for w in fold(text).split() if w not in NOISE}


def candidates(query: str) -> list:
    page = get("/search?type=product&q=" + urllib.parse.quote(query))
    out = []
    for handle in re.findall(r'href="/products/([a-z0-9\-]+)', page):
        if handle not in out:
            out.append(handle)
    return out[:12]


def panel(page: str) -> dict:
    i = page.find("Dane Techniczne")
    text = html.unescape(re.sub(r"<[^>]+>", "|", page[i : i + 6000])) if i >= 0 else ""
    text = re.sub(r"\s+", " ", text)
    parts = [p.strip() for p in text.split("|") if p.strip()]
    fields = {}
    for k, label in [("cas", "CAS#:"), ("inci", "INCI:"), ("nuta", "NUTA:"), ("forma", "FORMA:"), ("producent", "PRODUCENT:"), ("moc", "MOC ZAPACHU:")]:
        if label in parts:
            j = parts.index(label)
            value = parts[j + 1] if j + 1 < len(parts) else ""
            fields[k] = "" if value.endswith(":") else value
    if "Opis Składnika:" in parts:
        j = parts.index("Opis Składnika:")
        end = parts.index("Dokumenty") if "Dokumenty" in parts else j + 6
        fields["opis"] = " ".join(parts[j + 1 : end])
    return fields


def documents(page: str) -> dict:
    out = {}
    for kind in ["sds", "ifra", "coa", "eu-allergens"]:
        m = re.search(rf'data-{kind}-link="([^"]*)"', page)
        link = m.group(1) if m else ""
        out[kind] = ("https:" + link.split("?")[0]) if link.startswith("//") else link.split("?")[0]
    return out


def title_of(page: str) -> str:
    m = re.search(r"<title>(.*?)</title>", page, re.S)
    return html.unescape(re.sub(r"\s+", " ", m.group(1))).strip() if m else ""


def best(product: str) -> tuple:
    """The candidate whose title shares most words with the ordered product, and how many it shares."""
    want = words(product)
    query = re.sub(r"[®™]", "", product)
    tried = []
    for q in [query, re.sub(r"\s*\(.*?\)|\d+\s*%", "", query).strip()]:
        for handle in candidates(q):
            if handle in [t[0] for t in tried]:
                continue
            page = get("/products/" + handle)
            if not page:
                continue
            have = words(title_of(page).split("–")[0].split("|")[0])
            tried.append((handle, page, len(want & have) / max(len(want), 1), len(have - want)))
            if tried[-1][2] == 1 and tried[-1][3] == 0:
                break  # the very title: no need to read the rest
        if tried and any(t[2] == 1 and t[3] == 0 for t in tried):
            break
    if not tried:
        return None, None, 0.0
    tried.sort(key=lambda t: (-t[2], t[3]))
    return tried[0][0], tried[0][1], tried[0][2]


# Checked by hand on 2026-11-19: the shop has no page for these today, so what the search returns is another product.
NOT_FOUND = {
    "18": "the search links /products/ambrostar, which answers 404",
    "30": "the search finds no Tropicalia (it returns Fructone, Frangipani…)",
    "43": "the search links /products/orionide, which answers 404",
}


def main() -> None:
    with open(os.path.join(HERE, "pedido.csv"), encoding="utf-8") as f:
        order = list(csv.DictReader(f))
    columns = ["n", "producto", "url", "titulo", "coincidencia", "cas", "inci", "nuta", "forma", "producent", "moc", "opis", "sds", "ifra", "coa", "eu_allergens"]
    rows = []
    for o in order:
        row = {"n": o["n"], "producto": o["producto"]}
        if o["n"] in NOT_FOUND:
            row["titulo"] = "no page: " + NOT_FOUND[o["n"]]
            rows.append(row)
            continue
        handle, page, score = best(o["producto"])
        if handle:
            d = documents(page)
            row.update({"url": f"{BASE}/products/{handle}", "titulo": title_of(page), "coincidencia": f"{score:.2f}", **panel(page),
                        "sds": d["sds"], "ifra": d["ifra"], "coa": d["coa"], "eu_allergens": d["eu-allergens"]})
        rows.append(row)
        print(o["n"], o["producto"], "→", row.get("titulo", "—"), row.get("coincidencia", ""), file=sys.stderr)
    with open(os.path.join(HERE, "fichas.csv"), "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=columns, lineterminator="\n")
        w.writeheader()
        for r in rows:
            w.writerow({c: r.get(c, "") for c in columns})


if __name__ == "__main__":
    main()
