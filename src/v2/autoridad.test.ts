import { describe, expect, it } from "vitest";
import { v2Dataset } from "./data";

/**
 * No material has an authority better than its source (Phase 6): the authority of a figure is what its document is, never more.
 * And what comes from the glossary of the v1 brings only its identity and IFRA's own data: no document, no supplier list (D6, D9).
 */
const alta = import.meta.glob<string>("../../docs/v2/altas/*-glosario-*.json", { query: "?raw", import: "default", eager: true });

const data = v2Dataset();
const documents = new Map(data.documents.map((d) => [d.id, d]));

describe("a figure never has more authority than its document", () => {
  it("the annex's authority is only for IFRA's own files; producto and lote, only for documents of the product", () => {
    for (const row of data.composition) {
      const doc = documents.get(row.documentId);
      const where = `${row.containerId} → ${row.componentId} (${row.authority})`;
      if (row.authority === "anexo-ifra") {
        expect(doc?.type, where).toBe("anexo-ifra");
      }
      if (row.authority === "producto" || row.authority === "lote") {
        expect(doc, where).toBeDefined();
        expect(doc?.type, where).not.toBe("anexo-ifra");
        expect(doc?.reviewStatus, where).toBe("revisado");
      }
    }
  });

  it("a coverage that claims a complete list names a reviewed document", () => {
    for (const c of data.coverages.filter((x) => x.coverage === "reguladas-completa")) {
      expect(documents.get(c.documentId)?.reviewStatus, `${c.containerId}`).toBe("revisado");
    }
  });
});

describe("what enters from the glossary of the v1 (Phase 6)", () => {
  const files = Object.entries(alta).map(([path, text]) => ({ path, entry: JSON.parse(text) as { documentos: Array<{ tipo: string }>; materiales: Array<Record<string, unknown>> } }));

  it("there are glossary lots, and each brings only IFRA's own documents and no product", () => {
    expect(files.length).toBeGreaterThan(0);
    for (const { path, entry } of files) {
      expect(entry.documentos.every((d) => d.tipo === "anexo-ifra"), path).toBe(true);
      for (const m of entry.materiales) {
        expect(m["productos"] ?? [], `${path} ${String(m["clave"])}`).toEqual([]);
        expect(m["literatura"], `${path} ${String(m["clave"])}`).toBeUndefined();
        expect(m["certificado"], `${path} ${String(m["clave"])}`).toBeUndefined();
      }
    }
  });

  it("each of those materials is of unknown origin if a molecule, and its figures, if any, are the annex's", () => {
    const made = new Set(data.ids.filter((e) => e.entity === "material" && e.key.startsWith("glosario-")).map((e) => e.id));
    expect(made.size).toBeGreaterThan(0);
    for (const m of data.materials.filter((x) => made.has(x.id))) {
      expect(m.type, m.id).toBe("sustancia");
      expect(m.origin, m.id).toBe("desconocido");
    }
    for (const row of data.composition.filter((r) => made.has(r.containerId))) {
      expect(row.authority, `${row.containerId}`).toBe("anexo-ifra");
    }
    // None of them has a product of the user's: that is what the lots of products are for.
    expect(data.products.some((p) => made.has(p.materialId))).toBe(false);
  });
});
