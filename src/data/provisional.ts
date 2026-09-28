import constituyentes from "../../datos/glosario/material-constituyentes.csv?raw";
import materiales from "../../datos/glosario/materiales.csv?raw";
import procedencia from "../../datos/glosario/procedencia.json";
import paleta from "../../datos/fuente/pieza-11-paleta.csv?raw";
import estandares from "../../datos/ifra/51/estandares.csv?raw";
import { buildCatalog } from "./catalog";

/**
 * The catalog of the bench, built once from the glossary and IFRA's files. None of the
 * user's materials is read (P37); of the lab, only its own categorisation: the families
 * and their colours (P48).
 */
export const catalog = buildCatalog({ materiales, constituyentes, estandares, paleta, procedencia });
