"""Product name and CAS from each page of Takasago's Aroma Ingredients Compendium (2024)."""
import csv, re
from pathlib import Path

HERE = Path(__file__).parent
CAS = re.compile(r"\b\d{2,7}-\d{2}-\d\b")
DESCRIPTORS = re.compile(r"^[A-Z][A-Z\- ]+$")
SKIP = re.compile(r"Sustainable Scent|Chiraroma|CHEMICAL STRUCTURE|SYNONYM", re.I)

out = []
pages = (HERE / "takasago.txt").read_text(encoding="latin-1").split("\f")
for n, page in enumerate(pages, 1):
    lines = [l for l in page.splitlines() if l.strip()]
    cas_line = next((l for l in lines if "CAS No." in l and CAS.search(l)), None)
    if not cas_line:
        continue
    cas = CAS.findall(cas_line)
    # The name is the last column of the line just above the descriptors (MUSK SWEET FLORAL…).
    for i, l in enumerate(lines):
        last = re.split(r"\s{2,}", l.strip())[-1]
        if i > 0 and DESCRIPTORS.match(last) and len(last.split()) >= 2:
            j = i - 1
            while j >= 0 and SKIP.search(lines[j]):
                j -= 1
            name = re.split(r"\s{2,}", lines[j].strip())[-1]
            name = re.sub(r"[®™®�]|\bTM\b|(?<=[a-z])TM\b", "", name).strip()
            out.append({"pagina": n, "producto": name, "cas": " ".join(cas)})
            break

with (HERE / "takasago.csv").open("w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=["pagina", "producto", "cas"], lineterminator="\n")
    w.writeheader(); w.writerows(out)
for r in out:
    print(r["pagina"], "|", r["producto"], "|", r["cas"])
print(len(out), "productos")
