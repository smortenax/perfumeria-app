-- The resolved sheet (V3-70; docs-v3/sistema-materiales.md, «La ficha»). The loading script calls
-- common.refresh_sheets() after each load; it rewrites common.sheets and common.sheet_composition
-- whole, with the same ids each time (a generic sheet takes its material's id, a product's sheet
-- its product's), so PowerSync sees changed rows, not new ones.
--
-- What a sheet holds:
--   · one generic sheet per material that is not merged into another, and one per product that
--     has a starred claim or a composition of its own;
--   · its main family: of the starred families, the general family (A10) whose detailed families
--     add up to most, or the detailed one when it has no general family yet;
--   · its values: every starred claim, by attribute code. A product's sheet takes the product's
--     star and, where it has none, the generic one;
--   · its composition, the first that exists of: the product's (as sold), the material's generic
--     one (product authority first, then literature, then consensus, complete before incomplete),
--     IFRA's annex for the natural's own substance (the highest figure of each constituent), and,
--     for a pure material, its substance whole («identity»).

CREATE FUNCTION common.refresh_sheets() RETURNS integer
  LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE
  target record;
  chosen uuid;
  n integer := 0;
BEGIN
  DELETE FROM common.sheets;

  CREATE TEMP TABLE sheet_targets ON COMMIT DROP AS
    SELECT m.id AS sheet_id, m.id AS material_id, NULL::uuid AS product_id, NULL::text AS trade_name
      FROM common.materials m WHERE m.merged_into_id IS NULL
    UNION ALL
    SELECT p.id, p.material_id, p.id, p.trade_name
      FROM common.products p JOIN common.materials m ON m.id = p.material_id
     WHERE m.merged_into_id IS NULL
       AND (EXISTS (SELECT 1 FROM common.claims c WHERE c.product_id = p.id AND c.rank = 'star')
            OR EXISTS (SELECT 1 FROM common.compositions k WHERE k.product_id = p.id));

  CREATE TEMP TABLE sheet_stars ON COMMIT DROP AS
    SELECT DISTINCT ON (t.sheet_id, c.attribute_id) t.sheet_id, a.code, c.*
      FROM sheet_targets t
      JOIN common.claims c ON c.material_id = t.material_id AND c.rank = 'star'
                          AND (c.product_id IS NULL OR c.product_id = t.product_id)
      JOIN common.attributes a ON a.id = c.attribute_id
     ORDER BY t.sheet_id, c.attribute_id, (c.product_id IS NULL);

  INSERT INTO common.sheets (id, material_id, product_id, name, trade_name, ticker, type, identity_key,
                             family_id, duration_h, working_dilution, density, note_id, values)
  SELECT t.sheet_id, t.material_id, t.product_id, m.name, t.trade_name, m.ticker, m.type, m.identity_key,
    (SELECT coalesce(v.parent_id, v.id) FROM sheet_stars s
       JOIN common.claim_terms ct ON ct.claim_id = s.id JOIN common.vocabularies v ON v.id = ct.vocabulary_id
      WHERE s.sheet_id = t.sheet_id AND s.code = 'families'
      GROUP BY coalesce(v.parent_id, v.id)
      ORDER BY sum(ct.percentage) DESC NULLS LAST, min(ct.sort) NULLS LAST, 1 LIMIT 1),
    (SELECT s.value_min FROM sheet_stars s WHERE s.sheet_id = t.sheet_id AND s.code = 'duration_strip'),
    (SELECT s.original_value FROM sheet_stars s WHERE s.sheet_id = t.sheet_id AND s.code = 'working_dilution'),
    (SELECT s.value_min FROM sheet_stars s WHERE s.sheet_id = t.sheet_id AND s.code = 'density'),
    (SELECT ct.vocabulary_id FROM sheet_stars s JOIN common.claim_terms ct ON ct.claim_id = s.id
      WHERE s.sheet_id = t.sheet_id AND s.code = 'note' ORDER BY ct.sort NULLS LAST, ct.id LIMIT 1),
    coalesce((SELECT jsonb_object_agg(s.code, jsonb_strip_nulls(jsonb_build_object(
        'claim', s.id, 'source', s.source_id, 'product', s.product_id,
        'original', s.original_value, 'unit', s.original_unit,
        'min', s.value_min::text, 'max', s.value_max::text, 'text', s.value_text,
        'scale', s.scale_id, 'support', s.support, 'dilution', s.dilution::text,
        'terms', (SELECT jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id', v.id, 'code', v.code, 'name', v.name, 'fraction', ct.percentage::text))
                                   ORDER BY ct.sort NULLS LAST, ct.percentage DESC NULLS LAST, v.code)
                    FROM common.claim_terms ct JOIN common.vocabularies v ON v.id = ct.vocabulary_id
                   WHERE ct.claim_id = s.id))))
      FROM sheet_stars s WHERE s.sheet_id = t.sheet_id), '{}'::jsonb)
  FROM sheet_targets t JOIN common.materials m ON m.id = t.material_id;
  GET DIAGNOSTICS n = ROW_COUNT;

  FOR target IN SELECT st.*, m.type, m.substance_id FROM sheet_targets st JOIN common.materials m ON m.id = st.material_id LOOP
    SELECT k.id INTO chosen FROM common.compositions k
     WHERE (target.product_id IS NOT NULL AND k.product_id = target.product_id) OR k.material_id = target.material_id
     ORDER BY (k.product_id IS NULL),
              CASE k.authority WHEN 'product' THEN 0 WHEN 'literature' THEN 1 ELSE 2 END,
              k.incomplete, k.id
     LIMIT 1;
    IF chosen IS NOT NULL THEN
      INSERT INTO common.sheet_composition (id, sheet_id, substance_id, amount_kind, value, min, max, authority, origin, origin_id)
      SELECT md5(target.sheet_id::text || l.substance_id::text)::uuid, target.sheet_id, l.substance_id, l.amount_kind, l.value, l.min, l.max, k.authority, 'compositions', l.id
        FROM common.composition_lines l JOIN common.compositions k ON k.id = l.composition_id
       WHERE l.composition_id = chosen;
    ELSIF target.substance_id IS NOT NULL AND EXISTS (SELECT 1 FROM common.ifra_annex x WHERE x.natural_substance_id = target.substance_id) THEN
      INSERT INTO common.sheet_composition (id, sheet_id, substance_id, amount_kind, value, authority, origin, origin_id)
      SELECT md5(target.sheet_id::text || x.constituent_substance_id::text)::uuid, target.sheet_id, x.constituent_substance_id, 'unspecified', x.concentration, 'ifra', 'ifra_annex', x.id
        FROM (SELECT DISTINCT ON (constituent_substance_id) * FROM common.ifra_annex
               WHERE natural_substance_id = target.substance_id AND concentration > 0
               ORDER BY constituent_substance_id, concentration DESC, id) x;
    ELSIF target.type = 'pure' THEN
      INSERT INTO common.sheet_composition (id, sheet_id, substance_id, amount_kind, value, authority, origin)
      VALUES (md5(target.sheet_id::text || target.substance_id::text)::uuid, target.sheet_id, target.substance_id, 'typical', 1, 'identity', 'identity');
    END IF;
  END LOOP;

  DROP TABLE sheet_stars;
  DROP TABLE sheet_targets;
  RETURN n;
END $$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION common.refresh_sheets() FROM PUBLIC, anon, authenticated;
