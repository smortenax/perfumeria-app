"""Normalizar lo leído en la web al vocabulario de la app y elegir entre referencias (tandas 46 y siguientes)."""
import re
from pathlib import Path

ORDER = ["tgsc", "givaudan", "firmenich", "iff", "symrise", "takasago", "fraterworks", "perfumer's apprentice",
         "perfumers apprentice", "scentree", "scentspiracy", "perfumersworld", "pell wall", "eden", "premiere peau",
         "perfumate"]
FAMILY_WORDS = [  # palabra de la referencia → familia de la app (family_palette.csv, «covers»)
    ("citrus", "citrus"), ("aldehydic", "ozonic"), ("marine", "ozonic"), ("aquatic", "ozonic"), ("ozonic", "ozonic"),
    ("metallic", "ozonic"), ("green", "green"), ("herbal", "green"), ("aromatic", "green"), ("camphor", "green"),
    ("mint", "green"), ("galbanum", "green"), ("foliage", "green"), ("floral", "floral"), ("rosy", "floral"),
    ("honey", "floral"), ("powdery", "floral"), ("fruit", "fruity"), ("berry", "fruity"), ("plum", "fruity"),
    ("cassis", "fruity"), ("spic", "spicy"), ("anis", "spicy"), ("pepper", "spicy"), ("wood", "woody"),
    ("cedar", "woody"), ("sandal", "woody"), ("earthy", "woody"), ("smoky", "woody"), ("tobacco", "woody"),
    ("musk", "animal"), ("animal", "animal"), ("leather", "animal"), ("amber", "animal"), ("civet", "animal"),
    ("roast", "transformed"), ("sulfur", "transformed"), ("sulphur", "transformed"), ("nutty", "transformed"),
    ("phenolic", "transformed"), ("vanill", "gourmand"), ("caramel", "gourmand"), ("balsam", "gourmand"),
    ("creamy", "gourmand"), ("sugary", "gourmand"), ("resin", "gourmand"),
]
NOT_THIS = re.compile(r"otro producto|different product|no es un 'up to|incoheren|honey replacer|verificar identidad|inferid", re.I)
# Otra concentración del mismo material: no vale para cifras (horas, fuerza, uso, estado), sí para la familia, el nivel o el olor.
OTHER_STRENGTH = re.compile(r"no (?:la |es )?tintura|material puro|absoluto puro|aceite puro|no puro|diluido|al \d+ % en|\d+ % en dpg", re.I)


def rank(fuente):
    f = fuente.lower()
    return next((i for i, k in enumerate(ORDER) if k in f), len(ORDER))


def site(fuente):
    return fuente.split(",")[0].strip()


def family(v):
    v = v.lower()
    return next((fam for w, fam in FAMILY_WORDS if w in v), None)


def tier(v):
    v = v.lower().replace("middle", "heart")
    top, heart, base = "top" in v, "heart" in v, "base" in v
    if top and heart and not base: return "top_heart"
    if heart and base and not top: return "heart_base"
    if top + heart + base == 1: return "top" if top else "heart" if heart else "base"
    return None


def strength(v):
    v = v.lower()
    m = re.search(r"\((\d)/5\)|(\d)/5", v)
    if m:
        n = int(m.group(1) or m.group(2))
        return ["low", "low", "low", "medium", "high", "very_high"][n]
    if re.search(r"very (high|strong|powerful)|extremely|overpower", v): return "very_high"
    if re.search(r"high|strong|powerful|intense|potent", v): return "high"
    if re.search(r"medium|moderate", v): return "medium"
    if re.search(r"low|weak|mild|soft|delicate", v): return "low"
    return None


UNIT = {"h": 1, "day": 24, "día": 24, "week": 168, "semana": 168, "month": 720, "mes": 720}


def hours(v):
    """Horas en tira; días, semanas y meses se pasan a horas (un mes, 720 h)."""
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*(h|days?|días?|weeks?|semanas?|months?|mes(?:es)?)\b", v, re.I) or re.search(r"(\d+(?:[.,]\d+)?)()", v)
    if not m: return None
    unit = next((k for k in UNIT if m.group(2).lower().startswith(k)), "h") if m.group(2) else "h"
    return str(round(float(m.group(1).replace(",", ".")) * UNIT[unit]))


def same_hours(a, b):
    """Dos cifras de horas coinciden si no se separan más de un 25 %."""
    a, b = float(a), float(b)
    return max(a, b) <= 1.25 * min(a, b)


def dose(v):
    """Solo «up to X %» con base declarada: el máximo y su base."""
    m = re.search(r"up to (\d+(?:\.\d+)?)\s*% in the fragrance concentrate", v)
    return f"{float(m.group(1)) / 100:g}|concentrate" if m else None


def state(v):
    """Para comparar: líquido, sólido o los dos. Se guarda el texto de la referencia."""
    v = v.lower()
    solid, liquid = bool(re.search(r"solid|crystal|powder|paste|sólido", v)), bool(re.search(r"liquid|liquide|oil", v))
    return "liquid/solid" if solid and liquid else "solid" if solid else "liquid" if liquid else None


NORM = {"familia": family, "nivel": tier, "fuerza": strength, "horas": hours, "estado": lambda v: v.strip() or None, "dosis": dose}
FIELD = {"familia": "family", "nivel": "tier", "fuerza": "strength", "horas": "tenacity_hours", "estado": "physical_state", "dosis": "dose"}

def choose(campo, reads, tincture=False):
    """Lo que dicen las referencias de un campo → (valor, primera fila, disputado, otras, regla); valor None si nada."""
    got, dropped = [], []
    for r in reads:
        if not r["valor"].strip():
            continue
        if NOT_THIS.search(r["nota"]) or (campo in ("horas", "fuerza", "dosis", "estado") and OTHER_STRENGTH.search(r["nota"])) or (tincture and campo in ("horas", "fuerza", "dosis", "estado") and not (re.search(r"tintura|tincture", r["nota"] + r["fuente"], re.I) and not OTHER_STRENGTH.search(r["nota"]))):
            dropped.append(f"{site(r['fuente'])}: {r['valor']} ({r['nota'] or 'no es este producto'})")
            continue
        v = NORM[campo](r["valor"])
        (got if v else dropped).append((v, r) if v else f"{site(r['fuente'])}: {r['valor']} (no se lee en el vocabulario de la app)")
    got.sort(key=lambda x: rank(x[1]["fuente"]))
    if not got:
        return None, None, False, "; ".join(dropped), "no lo dice ninguna referencia: queda vacío"
    value, first = got[0]
    tg = next((v for v, r in got if rank(r["fuente"]) == 0), None)
    indep = [(v, r) for v, r in got if not ("premiere peau" in r["fuente"].lower() and tg is not None and v == tg)]
    key = (lambda v: state(v) or v) if campo == "estado" else (lambda v: v)
    values = {key(v) for v, _ in indep}
    if campo == "horas" and all(same_hours(v, indep[0][0]) for v, _ in indep):
        values = {indep[0][0]}
    regla = ("dos referencias o más coinciden" if len(indep) > 1 and len(values) == 1 else
             "las referencias no coinciden: va la primera por orden y el campo, disputado" if len(values) > 1 else
             "una referencia") + (f"; {first['nota']}" if first["nota"] else "")
    return value, first, len(values) > 1, "; ".join([f"{site(r['fuente'])}: {v}" for v, r in got[1:]] + dropped), regla
