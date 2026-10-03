# -*- coding: utf-8 -*-
"""La evidencia de los conflictos abiertos de un lote, sacada del texto de sus documentos (CLAUDE.md, «Cómo se migra»).

El nombre de un producto o de un documento no es evidencia. Lo que un documento puede responder (tipo, dilución,
origen, forma) se responde con su texto, extraído por script, y cada recomendación cita la frase y la página. Si el
documento no lo dice, se escribe «no lo dice»: no se supone.

Para cada conflicto (abierto o ya respondido, para que quede el registro) de tipo `tipo`, `origen`, `documento-diluido` y `forma`, se busca en el certificado IFRA y en
la SDS del producto (las dos de la página de la tienda):

* SDS, sección 3: la composición (cada ingrediente con su %), si es sustancia o mezcla y si lleva un disolvente.
* Certificado, secciones 2.1 y 2.2 (el formato de Firmenich): otros naturales o moléculas ajenas a la identidad del producto.
* Las dos: las frases que hablan del origen (natural, síntesis, fermentación, aislado de…) y de la forma (especie, parte,
  proceso).

Un PDF que el script no puede leer (cifrado: `pypdf` necesita `cryptography`) se lee a mano y se transcribe en
`docs/v2/evidencia-transcrita.csv` (documento, pagina, tema, frase), y sale marcado como «transcrito a mano».

Escribe `datos/v2/evidencia/<lote>.csv` (producto, conflicto, frase, documento, pagina). Uso:
    python scripts/v2/evidencia.py --lote 4a
    python scripts/v2/evidencia.py --tabla-dilucion        (la dilución de cada producto con documentos: SDS sección 3)
"""
import argparse
import csv
import logging
import re
import sys
from pathlib import Path

logging.disable(logging.CRITICAL)
ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / "datos" / "glosario" / ".cache" / "proveedores" / "perfumiarz"
HAND = ROOT / "docs" / "proveedores" / "certificados"
TRANSCRIBED = ROOT / "docs" / "v2" / "evidencia-transcrita.csv"
COLUMNS = ["producto", "conflicto", "frase", "documento", "pagina"]
TYPES = ("tipo", "origen", "documento-diluido", "forma")

SOLVENTS = {  # name in a section 3 → what it is
    "dipropylene glycol": "DPG", "dipropylene": "DPG", "propylene glycol": "PG", "propane-1,2-diol": "PG",
    "isopropyl myristate": "IPM", "triethyl citrate": "TEC", "diethyl phthalate": "DEP", "ethanol": "etanol",
    "ethyl alcohol": "etanol", "benzyl benzoate": "benzoato de bencilo", "triacetin": "triacetina",
    "tetradecanoic acid, 1-methylethyl ester": "IPM", "hexylene glycol": "hexilenglicol", "glycerol": "glicerina",
}
SOLVENT_CAS = {"34590-94-8": "DPG", "57-55-6": "PG", "110-27-0": "IPM", "77-93-0": "TEC", "84-66-2": "DEP", "64-17-5": "etanol",
               "102-71-6": "trietanolamina", "102-76-1": "triacetina", "56-81-5": "glicerina"}
ORIGIN = re.compile(r"\b(natural|naturally|synthetic|synthesi[sz]ed?|synthesis|semi-?synthetic|ferment\w*|biotech\w*|biosynth\w*|"
                    r"nature[- ]identical|renewable|obtained (?:from|by)|derived from|isolated|isolate|distill\w*|extract(?:ion|ed)?|"
                    r"botanical|plant|essential oil|origin|type nat|bio-?based|ISO 16128|COSMOS)\b", re.I)
ORIGIN_NOISE = re.compile(r"natural (?:person|gas|rubber|resource|environment|water|disaster|ventilation|light)|"
                          r"naturally occurring in the environment|persistent|extractor|extraction (?:system|equipment|ventilation)|"
                          r"local exhaust|extinguish|plant (?:personnel|safety)|water treatment plant|waste|ventilation|"
                          r"distillation (?:range|residues)|chemical safety|SECTION|contact the plant|manufacturing plant|"
                          r"environmental|ecotox|biodegrad|inventory|notified|REACH|ironing water|container of origin|treatment plant|sewage|"
                          r"natural components and synthetic impurities|literature data|odorized|country of origin|origin of the|sludge|EUSES", re.I)
FORM = re.compile(r"\b(piper|nigrum|fruit|berr(?:y|ies)|seed|leaf|leaves|flower|bark|wood|root|resin|balsam|absolute|concrete|"
                  r"resinoid|CO2|supercritical|extract|essential oil|tincture|INCI|botanical|species|hexane|solvent extraction)\b", re.I)
NATURAL_NAME = re.compile(r"\b(OIL|ABSOLUTE|EXTRACT|BALSAM|RESIN\w*|CONCRETE|TINCTURE|LEAF|WOOD|ROOT|FLOWER|BARK|SEED|CO2)\b", re.I)
NATURAL_CAS = re.compile(r"^(8\d{3}|9\d{4})-\d{2}-\d$")  # natural complex substances (8xxx-, 9xxxx-)


def rows(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def read_pages(path: Path) -> list[str] | None:
    """The text of each page, or None when the script cannot read the PDF (encrypted or broken)."""
    try:
        from pypdf import PdfReader
        return [(page.extract_text() or "") for page in PdfReader(str(path)).pages]
    except Exception:
        return None


def squash(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("|>", " ").replace("", "≥")).strip()


def locate(name: str) -> Path | None:
    for base in (CACHE / "documentos", HAND):
        if (base / name).exists():
            return base / name
    return None


def shown(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def shop_links(url: str) -> list[str]:
    """The PDFs the shop page links, in order."""
    page = CACHE / "paginas" / (url.rstrip("/").split("/")[-1] + ".html")
    if not page.exists():
        return []
    found: list[str] = []
    for m in re.finditer(r"files/([^\"?]+\.pdf)", page.read_text(encoding="utf-8", errors="replace")):
        if m.group(1) not in found:
            found.append(m.group(1))
    return found


def product_documents(product: dict[str, str]) -> dict[str, str | None]:
    links = shop_links(product["url"])
    sds = next((l for l in links if re.search(r"FDS|SDS|Karta_char", l, re.I) and not re.search(r"ALG|Allergen|IFRA", l, re.I)), None)
    return {"cert": product["documento"], "sds": sds}


class Doc:
    """A document of a product: its pages (or None), or its hand transcription."""

    def __init__(self, name: str | None):
        self.name = name
        self.path = locate(name) if name else None
        self.pages = read_pages(self.path) if self.path else None
        self.hand = [r for r in rows(TRANSCRIBED) if name and r["documento"] == name]

    @property
    def readable(self) -> bool:
        return self.pages is not None

    def cite(self) -> str:
        return shown(self.path) if self.path else (self.name or "")


def section(doc: Doc, start: str, end: str) -> tuple[str, str] | None:
    """The text from the line that matches `start` to the one that matches `end`, with the page it starts on."""
    if not doc.pages:
        return None
    lines: list[tuple[int, str]] = []
    for number, text in enumerate(doc.pages, 1):
        for line in text.splitlines():
            lines.append((number, line))
    first = next((i for i, (_, line) in enumerate(lines) if re.match(start, line.strip(), re.I)), None)
    if first is None:
        return None
    last = next((i for i in range(first + 1, len(lines)) if re.match(end, lines[i][1].strip(), re.I)), len(lines))
    pages = sorted({lines[i][0] for i in range(first, last)})
    page = str(pages[0]) if len(pages) == 1 else f"{pages[0]}-{pages[-1]}"
    return page, squash(" ".join(line for _, line in lines[first:last]))


def sds_section3(sds: Doc) -> tuple[str, str] | None:
    return section(sds, r"^((SECTION|SEKCJA)\s*)?3\s*[.:]?\s*(Composition|SK.AD)", r"^((SECTION|SEKCJA)\s*)?4\s*[.:]?\s*(First|Description of|.RODKI)")


def components(text: str) -> list[dict[str, str]]:
    """The ingredients of a section 3 of the InfoDyne style (Firmenich, Symrise, IFF): CAS, name and %."""
    out = []
    for chunk in re.split(r"(?=CAS:\s*\d)", text)[1:]:
        cas = re.match(r"CAS:\s*([\d-]+)", chunk)
        pct = re.findall(r"(?<![\d.-])(\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?)(?![\d-])", re.sub(r"(?:CAS|EC|REACH):\s*[\d-]+", " ", chunk))
        name = re.sub(r"^CAS:\s*[\d-]+\s*(EC:\s*[\d-]+\s*)?(REACH:\s*[\d-]+\s*)?", "", chunk)
        name = re.split(r"\s(?:GHS\d|Wng|Dgr)", name)[0]
        text = pct[-1].replace(" ", "") if pct else ""
        if text and max(float(x) for x in text.split("-")) > 100:
            text += " [la SDS dice más de 100: errata]"
        out.append({"cas": cas.group(1) if cas else "", "nombre": name.strip(), "pct": text})
    return out


def solvent_of(component: dict[str, str]) -> str:
    if component["cas"] in SOLVENT_CAS:
        return SOLVENT_CAS[component["cas"]]
    return next((v for k, v in SOLVENTS.items() if re.search(rf"{re.escape(k)}", component["nombre"].lower())), "")


def solvents_in(text: str) -> list[str]:
    """The solvents a section 3 text names (by name or CAS), for the formats that `components` does not parse."""
    found = {v for k, v in SOLVENTS.items() if re.search(rf"{re.escape(k)}", text.lower())} | {v for k, v in SOLVENT_CAS.items() if k in text}
    return sorted(found)


def unlisted(text: str, comps: list[dict[str, str]]) -> str:
    """What the section 3 leaves unlisted at most: 100 − the sum of the lower bounds it gives. A section 3 lists only the
    classified substances or those with an exposure limit, so a plain solvent (PG, DPG, IPM…) may well not be listed."""
    lows = [float(c["pct"].split("-")[0]) for c in comps if c["pct"] and "errata" not in c["pct"]]
    if not lows:
        m = re.search(r">=?\s*(\d+(?:[.,]\d+)?)\s*%?\s*(?:-\s*<=)?", text)
        lows = [float(m.group(1).replace(",", "."))] if m else []
    return f" | suma de los mínimos listados {sum(lows):g} %: lo no listado, hasta {max(0.0, 100 - sum(lows)):g} %" if lows else ""


def section3_kind(text: str) -> str:
    """«sustancia» if the section 3 gives the product as a substance (3.1) and the mixtures part (3.2) is empty, «mezcla» if it lists a mixture."""
    mixtures = re.search(r"3\.2\.?\s*(Mixtures|Mieszaniny)(.{0,40})", text, re.I)
    if mixtures and not re.search(r"not\s*concerned|not\s*applicable|none|n/a|brak", mixtures.group(2), re.I):
        return "mezcla"
    return "sustancia" if re.search(r"3\.1\.?\s*(Substances|Substancje)", text, re.I) else ""


def dilution_verdict(sds: Doc) -> tuple[str, str, str]:
    """(verdict, phrase, page). «pura»: the SDS gives the product as a substance, or its listed minimums add up to 90 % or more,
    and no solvent goes over 10 %. «disolvente»: it lists a solvent over 10 %. «no se sabe»: neither the one nor the other
    (an SDS lists only the classified substances, so an unclassified PG or DPG may be missing), or the SDS cannot be read."""
    found = composition_phrase(sds)
    if not found:
        return "no se sabe", "no lo dice" + (" (la SDS no se puede leer por script)" if sds.name else " (no hay SDS)"), ""
    phrase, page, _ = found
    s3 = sds_section3(sds)
    comps = components(s3[1])
    big = [c for c in comps if solvent_of(c) and c["pct"] and "errata" not in c["pct"] and float(c["pct"].split("-")[1]) > 10]
    kind = section3_kind(s3[1])
    if big:
        return "disolvente", f"SDS §3: {phrase}", page
    if kind == "sustancia":
        return "pura", f"SDS §3.1 (sustancia): {phrase}", page
    lows = [float(c["pct"].split("-")[0]) for c in comps if c["pct"] and "errata" not in c["pct"]]
    if sum(lows) >= 90:
        return "pura", f"SDS §3 ({kind or 'mezcla'}): {phrase}", page
    return "no se sabe", f"SDS §3 ({kind or 'mezcla'}): {phrase}", page


def composition_phrase(sds: Doc) -> tuple[str, str, bool] | None:
    """(phrase, page, has solvent) of the SDS section 3, from the parsed ingredients or, if it has another format, its text."""
    s3 = sds_section3(sds) if sds.readable else None
    if not s3:
        return None
    page, text = s3
    comps = components(text)
    if comps:
        solvents = [(c, solvent_of(c)) for c in comps if solvent_of(c)]
        phrase = ("disolvente " + "; ".join(f"{s}: {c['nombre'][:40]} {c['pct']} %" for c, s in solvents) if solvents
                  else "no declara disolvente") + " | " + "; ".join(f"{c['nombre'][:40]} {c['pct']} %" for c in comps[:5])
        return phrase + unlisted(text, comps), page, bool(solvents)
    found = solvents_in(text)
    body = re.sub(r"^SECTION\s*3\s*[.:]?\s*", "", text)[:320]
    return (("menciona " + ", ".join(found) + " | " if found else "no menciona disolvente | ") + body + unlisted(text, comps)), page, bool(found)


def sentences(pages: list[str], pattern: re.Pattern, noise: re.Pattern | None = None) -> list[tuple[str, str]]:
    """The sentences of the pages that match, with their page; a long one is cut to a window around the match."""
    hits = []
    for number, text in enumerate(pages, 1):
        flat = squash(text)
        for s in re.split(r"(?<=[.;:])\s+(?=[A-Z0-9(])", flat):
            m = pattern.search(s)
            if m and not (noise and noise.search(s)):
                if len(s) > 300:
                    s = ("…" if m.start() > 150 else "") + s[max(0, m.start() - 150):m.end() + 150] + "…"
                hits.append((str(number), s))
    return hits


def cert_entries(cert: Doc) -> list[tuple[str, str, str]]:
    """The substances that the Firmenich certificate lists in 2.1 / 2.2, with their pages: (page, section, entry)."""
    found = []
    if not cert.pages:
        return found
    for number, text in enumerate(cert.pages, 1):
        lines = [l.strip() for l in text.splitlines()]
        where = ""
        for line in lines:
            if re.match(r"2\.1\.?\s*Ingredients", line):
                where = "2.1"
            elif re.match(r"2\.2\.?\s*Ingredients", line):
                where = "2.2"
            elif where and re.match(r"^(3\.|Section 3|IFRA Category|Annex|ANNEX)", line):
                where = ""
            elif where:
                m = re.match(r"^(.+?)\s+(\d{2,6}-\d{2}-\d)\s+([\d.,]+)\s*%?$", line)
                if m:
                    found.append((str(number), where, f"{m.group(1)} {m.group(2)} {m.group(3)} %"))
    return found


def describe_type(sds: Doc, cert: Doc) -> list[tuple[str, str, Doc]]:
    out = []
    s3 = sds_section3(sds) if sds.readable else None
    if s3:
        page, text = s3
        comps = components(text)
        kind = "mezcla" if re.search(r"3\.2\.?\s*Mixtures", text, re.I) else ("sustancia" if re.search(r"3\.1\.?\s*Substances", text) else "")
        listing = "; ".join(f"{c['nombre'][:45]} ({c['cas'] or 'sin CAS'}) {c['pct']} %" for c in comps[:8]) or text[:250]
        out.append((f"SDS §3 {('(' + kind + ')') if kind else ''}: {len(comps)} ingredientes: {listing}"
                    + (" …" if len(comps) > 8 else ""), page, sds))
    entries = cert_entries(cert)
    for where in ("2.1", "2.2"):
        of = [(page, entry) for page, w, entry in entries if w == where]
        if of:
            naturals = [(page, e) for page, e in of if NATURAL_NAME.search(e) or NATURAL_CAS.match(e.split()[-3] if len(e.split()) > 3 else "")]
            out.append((f"certificado §{where}: {len(of)} sustancias declaradas; las mayores: "
                        + "; ".join(e for _, e in sorted(of, key=lambda x: -float(x[1].split()[-2].replace(",", ".")))[:4]), of[0][0], cert))
            for page, e in naturals:
                out.append((f"certificado §{where}: declara otro natural: {e}", page, cert))
    return out


def evidence_for(product: dict[str, str], kind: str) -> list[tuple[str, str, str]]:
    """(phrase, document, page) for one conflict kind."""
    docs = product_documents(product)
    cert, sds = Doc(docs["cert"]), Doc(docs["sds"])
    out: list[tuple[str, str, str]] = []

    def add(phrase: str, doc: Doc, page: str) -> None:
        out.append((phrase, doc.cite(), page))

    for doc in (cert, sds):
        for r in doc.hand:
            if r["tema"] in (kind, "todos"):
                out.append((r["frase"] + " [transcrito a mano]", doc.cite(), r["pagina"]))
    if kind == "tipo":
        for phrase, page, doc in describe_type(sds, cert):
            add(phrase, doc, page)
    elif kind == "documento-diluido":
        verdict, phrase, page = dilution_verdict(sds)
        add(f"[{verdict}] " + phrase, sds, page)
        for page, s in sentences(cert.pages or [], re.compile(r"dilut|solvent|\bin (?:DPG|PG|IPM|TEC|DEP)\b|propylene glycol", re.I))[:3]:
            add("certificado: " + s, cert, page)
    elif kind == "origen":
        for doc, label in ((sds, "SDS"), (cert, "certificado")):
            for page, s in sentences(doc.pages or [], ORIGIN, ORIGIN_NOISE)[:4]:
                add(f"{label}: {s}", doc, page)
    elif kind == "forma":
        found = composition_phrase(sds)
        if found:
            add("SDS §3, contexto: " + found[0], sds, found[1])
        for doc, label in ((sds, "SDS"), (cert, "certificado")):
            for page, s in sentences((doc.pages or [])[:2], FORM)[:4]:
                add(f"{label}: {s}", doc, page)
    if not out:
        unread = [d.name for d in (cert, sds) if d.name and not d.readable]
        out.append(("no lo dice" + (f" (el script no puede leer: {', '.join(unread)})" if unread else ""),
                    ", ".join(d.cite() for d in (cert, sds) if d.name), ""))
    return out


def run_lote(lot: str) -> int:
    products = {r["producto"]: r for r in rows(ROOT / "docs" / "proveedores" / "productos.csv")}
    out = []
    for c in rows(ROOT / "datos" / "v2" / "conflictos" / f"{lot}.csv"):
        if c["tipo"] not in TYPES:
            continue
        product = products.get(c["producto"])
        if not product:
            continue
        for phrase, doc, page in evidence_for(product, c["tipo"]):
            out.append({"producto": c["producto"], "conflicto": c["tipo"], "frase": phrase, "documento": doc, "pagina": page})
    target = ROOT / "datos" / "v2" / "evidencia" / f"{lot}.csv"
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(out)
    print(f"{len(out)} frases de evidencia en {shown(target)}")
    return 0


def run_dilution() -> int:
    """For each product with documents: the dilution of the shop and what the SDS (section 3) says."""
    mine = {(r["producto"]): r for r in rows(ROOT / "docs" / "proveedores" / "mis-productos.csv")}
    for p in rows(ROOT / "docs" / "proveedores" / "productos.csv"):
        sds = Doc(product_documents(p)["sds"])
        verdict, phrase, page = dilution_verdict(sds)
        shop = mine.get(p["producto"], {})
        shop_dilution = (shop.get("dilucion_pct", "") + " % " + shop.get("diluyente", "")).strip(" %")
        base = p["clase"].startswith("base")
        print(f"{p['producto']} | tienda: {shop_dilution or '—'} | {'BASE ' if base else ''}[{verdict}] p.{page}: {phrase[:300]}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lote")
    parser.add_argument("--tabla-dilucion", action="store_true")
    args = parser.parse_args()
    if args.tabla_dilucion:
        return run_dilution()
    if not args.lote:
        parser.error("hace falta --lote o --tabla-dilucion")
    return run_lote(args.lote)


if __name__ == "__main__":
    sys.exit(main())
