# -*- coding: utf-8 -*-
"""Lo que dice un certificado de PerfumersWorld de la caché, para revisarlo antes de traerlo (D6).

Lee `datos/glosario/.cache/certificados-pw/<SKU>.html` y saca solo lo que se revisa: el nombre y el
SKU, la tabla «IFRA Restricted materials» (sustancia, CAS, %), la de prohibidas, y si el documento
nombra el bergapteno, el 5-MOP o las furocumarinas. No lee el resto de la página.

Uso:  python scripts/v2/leer_pw.py 7CL24020 8TH08212 ...
"""
import html
import re
import sys
from pathlib import Path

CACHE = Path(__file__).resolve().parents[2] / "datos" / "glosario" / ".cache" / "certificados-pw"


def text_of(sku: str) -> list[str]:
    raw = (CACHE / f"{sku}.html").read_text(encoding="utf-8", errors="replace")
    raw = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", raw, flags=re.S | re.I)
    raw = html.unescape(re.sub(r"<[^>]+>", "\n", raw))
    return [line.strip() for line in raw.splitlines() if line.strip()]


def table(lines: list[str], start: str, stop: tuple[str, ...]) -> list[tuple[str, str, str]]:
    """The rows (name, CAS, %) of the table that follows the heading `start`, up to a stop line."""
    if start not in lines:
        return []
    cells: list[str] = []
    for line in lines[lines.index(start) + 1:]:
        if line.startswith(stop):
            break
        cells.append(line)
    cells = cells[3:] if cells[:3] == ["Ingredient name", "CAS", "Concentration (%)"] else cells
    return [(cells[i], cells[i + 1], cells[i + 2]) for i in range(0, len(cells) - 2, 3)
            if re.fullmatch(r"[\d-]+", cells[i + 1])]


def main() -> None:
    for sku in sys.argv[1:]:
        lines = text_of(sku)
        head = next((i for i, line in enumerate(lines) if line.startswith("Product Documents -")), 0)
        name = lines[head].removeprefix("Product Documents - ")
        date = lines[lines.index("Date:") + 1] if "Date:" in lines else "?"
        restricted = table(lines, "IFRA Restricted materials:", ("IFRA Prohibited", "Allergen Declaration"))
        prohibited = table(lines, "IFRA Prohibited materials:", ("Specifications", "Allergen Declaration"))
        mentions = sorted({m.group(0).lower() for line in lines for m in re.finditer(r"(?i)bergapt\w*|5-MOP|furocoum\w*|psoralen", line)})
        print(f"== {sku}: {name} (fecha {date})")
        print("   restringidas:", "; ".join(f"{n} {c} {p}" for n, c, p in restricted) or "ninguna")
        print("   prohibidas:", "; ".join(f"{n} {c} {p}" for n, c, p in prohibited) or "ninguna")
        print("   bergapteno / 5-MOP / furocumarinas:", ", ".join(mentions) or "no se nombran")


if __name__ == "__main__":
    main()
