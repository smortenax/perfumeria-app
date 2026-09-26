import constituyentes from "../../datos/glosario/material-constituyentes.csv?raw";
import materiales from "../../datos/glosario/materiales.csv?raw";
import procedencia from "../../datos/glosario/procedencia.json";
import estandares from "../../datos/ifra/51/estandares.csv?raw";
import { buildCatalog } from "./catalog";

/** The catalog of the bench, built once from the glossary and IFRA's files. Nothing of the lab is read (P37). */
export const catalog = buildCatalog({ materiales, constituyentes, estandares, procedencia });
