# -*- coding: utf-8 -*-
"""El reconocimiento de un natural por su identidad (D10, reconciliado con D14 el 2026-10-04).

Un estándar de un aceite (086–096) se reconoce también por especie + parte + proceso, no solo por el CAS del índice:
* la **especie** tiene que estar dicha y coincidir con la de la regla («no lo dice» nunca empareja);
* la **parte** y el **proceso**, si son «no lo dice» (o están vacíos) o, el proceso, solo «aceite esencial», cuentan como coincidentes
  (el peor caso); si dicen algo, tiene que ser lo de la regla;
* una palabra de exclusión en el proceso (FCF, sin furocumarinas…) lo deja fuera de la regla.
"""
import re

SAID_NOTHING = ("", "no lo dice")
GENERIC_PROCESS = ("", "no lo dice", "aceite esencial")


def species_key(species: str) -> str:
    """Género y epíteto en minúsculas, con su variedad o subespecie si la tiene; sin el signo de híbrido ni el autor.

    «Rosa x centifolia L.» y «Rosa centifolia» son una; «Citrus aurantium var. amara» no es «Citrus aurantium».
    """
    words = [w for w in re.split(r"[\s,]+", species.lower()) if w and w != "x"]
    key = words[:2]
    rest = words[2:]
    if len(rest) >= 2 and rest[0] in ("var.", "subsp.", "ssp."):
        key += rest[:2]
    return " ".join(key)


def identity_match(rule: dict, species: str, part: str, process: str) -> str | None:
    """«miembro» si la regla reconoce el natural, «excluido» si la reconocería pero su proceso lleva una palabra de exclusión, None si no."""
    sp = species.strip().lower()
    if sp in SAID_NOTHING or species_key(species) not in {species_key(x) for x in rule["especies"]}:
        return None
    part_l = part.strip().lower()
    proc_l = process.strip().lower()
    part_ok = part_l in SAID_NOTHING or any(x in part_l for x in rule["partes"])
    lead = proc_l.split(";")[0].strip()
    proc_ok = lead in GENERIC_PROCESS or any(x in proc_l for x in rule["procesos"])
    if not (part_ok and proc_ok):
        return None
    return "excluido" if any(x in proc_l for x in rule["excluye"]) else "miembro"
