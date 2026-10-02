# -*- coding: utf-8 -*-
"""Lee un certificado de conformidad IFRA de cualquiera de los fabricantes que usa el usuario (P62).

Los formatos que se han visto (2026-10-02): Firmenich («2.2. Ingredients and substances subject to
limitations by IFRA»), IFF («contains the following materials… Ingredient Name CAS Number
Concentration (%)», a veces con varios CAS por línea y cantidades «<0.1»), Symrise y Givaudan (lo
habitual: «does not contain any substance restricted»), PCW («none components»). Lo que se saca:

* `product`, `maker`, `code`: el nombre del producto en el certificado, el fabricante y su código;
* `substances`: cada línea de la lista de sustancias restringidas o prohibidas, con su nombre, sus
  CAS, su cantidad en % del producto y si es una cota («<0.1»: se cuenta 0,1, el peor caso);
* `none_declared`: el certificado dice expresamente que no lleva ninguna;
* `cat4`: el tope del producto en la categoría 4, como lo escribe («9.6296%», «No Restriction»);
* `dilution`: el % de materia pura si el nombre del producto dice que es una dilución («10% IPM»),
  para pasar sus cifras a materia pura. «NEAT», «ABS.» y un nombre sin % son el producto puro.

Solo usa `pypdf`. Un PDF cifrado o roto devuelve None.
"""
import logging
import re
from pathlib import Path

from pypdf import PdfReader

logging.disable(logging.CRITICAL)

MAKERS = [("Firmenich", r"firmenich"), ("Givaudan", r"givaudan"), ("IFF", r"\bIFF\b|International Flavors"),
          ("Symrise", r"symrise|Saddle Brook"), ("BASF", r"\bBASF\b"), ("PCW", r"\bPCW\b|pcwfrance"),
          ("Synarome", r"synarome"), ("Takasago", r"takasago"), ("Kao", r"\bKao\b")]
CAS = r"\d{2,7}-\d{2}-\d"
NONE_SAID = re.compile(r"No substances to declare|does not contain any substances? restricted|Does not contain any substance restricted|"
                       r"none components|No restricted materials", re.I)
# Where the list of substances starts, and what ends it.
START = re.compile(r"2\.2\.\s*Ingredients|2\.1\.\s*Ingredients|contains the following materials|Ingredient Name\s+CAS|"
                   r"IFRA restricted materials are contained|"
                   r"Name\s+C\.?A\.?S\.?\s+%|IFRA Restricted materials", re.I)
END = re.compile(r"^\s*3\.\s+Substances|\*Concentrations shown|Should you have any further|We certify that|APPENDIX FOR IFRA|"
                 r"According to the IFRA Code", re.I)
LINE = re.compile(rf"^(?P<name>.+?)\s+(?P<cas>{CAS}(?:\s*,\s*{CAS})*),?\s+(?P<bound><)?\s*(?P<value>\d+(?:[.,]\d+)?)\s*%?\s*$")
# Symrise writes the CAS first: «101-86-0 alpha-Hexyl cinnamic aldehyde 0,0046».
LINE_CAS_FIRST = re.compile(rf"^(?P<cas>{CAS})\s+(?P<name>.+?)\s+(?P<bound><)?\s*(?P<value>\d+(?:[.,]\d+)?)\s*%?\s*$")


def text_of(pdf: Path) -> str | None:
    try:
        return "\n".join(page.extract_text() or "" for page in PdfReader(pdf).pages)
    except Exception:  # an encrypted or broken PDF
        return None


def _lines(text: str) -> list[str]:
    raw = [" ".join(l.split()) for l in text.splitlines()]
    out: list[str] = []
    for line in raw:
        # A list of CAS broken over two lines («68648-41-9, …, 90028-67-4,» / «92129-88-9, 90028-68-5 100»).
        if out and re.search(rf"{CAS},$", out[-1]) and re.match(CAS, line):
            out[-1] += " " + line
        else:
            out.append(line)
    return out


def category_4(lines: list[str], text: str) -> str:
    for i, line in enumerate(lines):
        m = re.match(r"^(?:Category\s+)?4\s+(?:Products related to fine fragrance)?\s*((?:\d+[.,]?\d*)\s*%|No Restriction|Not Permitted)\s*$", line)
        if m:
            return m.group(1).replace(" ", "")
        # Symrise, per application and without «%»: «4 1,20».
        m = re.match(r"^4\s+(\d+[.,]\d+)\s*%?$", line)
        if m:
            return m.group(1) + "%"
        if re.match(r"^4\s+Hydroalcoholic", line):
            for nxt in lines[i:i + 4]:
                found = re.search(r"(\d+(?:[.,]\d+)?)\s*$", nxt)
                if found:
                    return found.group(1) + "%"
    m = re.search(r"Category 4\s+(\d+[.,]?\d*)\s*%", text)
    return (m.group(1) + "%") if m else ""


def parse(text: str) -> dict:
    lines = _lines(text)
    flat = " ".join(lines)
    product = ""
    for pat in (r"Product Name:\s*(.+?)\s+Sales Number", r"Identity of the product:\s*Name\s*:\s*(.+?)\s+Code No", r"Product:\s*(.+?)\s+(?:\d{6,}|Item code|Combined)"):
        m = re.search(pat, flat)
        if m:
            product = m.group(1).strip()
            break
    if not product:
        product = next((l for l in lines[:40] if re.search(r"\b\d{6}\b", l) and l.isupper() and "IFRA" not in l), "")
    code = ""
    for pat in (r"Sales Number:\s*(\S+)", r"Code No\.:\s*(\S+)", r"Item code\s*:\s*([\w-]+(?:\s*-\s*\d+)?)", r"\b(\d{6,7})\b"):
        m = re.search(pat, flat if "Sales" in pat or "Code" in pat or "Item" in pat else product)
        if m:
            code = m.group(1).replace(" ", "")
            break
    maker = next((name for name, pat in MAKERS if re.search(pat, text, re.I)), "")
    substances = []
    inside = False
    for line in lines:
        if START.search(line):
            inside = True
        if inside and END.search(line):
            inside = False
        m = (LINE.match(line) or LINE_CAS_FIRST.match(line)) if inside else None
        if m and not re.match(r"^(Ingredient Name|Name)\b", m.group("name")):
            substances.append({
                "name": m.group("name").strip(" ,"),
                "cas": [c.strip() for c in m.group("cas").split(",")],
                "value": m.group("value").replace(",", "."),
                "bound": m.group("bound") is not None,
            })
    dilution = re.search(r"(\d+(?:[.,]\d+)?)\s*%", product)
    return {
        "product": product, "maker": maker, "code": code, "substances": substances,
        "none_declared": not substances and NONE_SAID.search(text) is not None,
        "cat4": category_4(lines, text),
        "dilution": dilution.group(1).replace(",", ".") if dilution else "",
    }
