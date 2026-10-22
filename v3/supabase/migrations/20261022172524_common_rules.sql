-- The rules of the common schema that Drizzle does not write (V3-70; docs-v3/sistema-materiales.md).
--
-- Who reads and writes: every signed-in user reads all of it; nobody writes it but the loading
-- script, which connects as the database owner (or with the service key) and is not stopped by
-- RLS. PowerSync reads it like the rest (its role and the publication cover every schema).

GRANT USAGE ON SCHEMA common TO authenticated, service_role, powersync_role;
--> statement-breakpoint
GRANT SELECT ON ALL TABLES IN SCHEMA common TO authenticated, powersync_role;
--> statement-breakpoint
GRANT ALL ON ALL TABLES IN SCHEMA common TO service_role;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA common GRANT SELECT ON TABLES TO authenticated, powersync_role;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA common GRANT ALL ON TABLES TO service_role;
--> statement-breakpoint
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'common' LOOP
    EXECUTE format('ALTER TABLE common.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I ON common.%I FOR SELECT TO authenticated USING (true)', t || ': read', t);
  END LOOP;
END $$;
--> statement-breakpoint

-- One star per material, product and attribute (V3-70, decided 2026-10-22). Two empty products
-- count as the same one, so the generic star is unique too (NULLS NOT DISTINCT, Postgres 15+).
CREATE UNIQUE INDEX claims_one_star ON common.claims (material_id, product_id, attribute_id) NULLS NOT DISTINCT
  WHERE rank = 'star';
--> statement-breakpoint

-- A term of a list claim belongs to the attribute's list: a family cannot be a descriptor.
CREATE FUNCTION common.check_claim_term_list() RETURNS trigger
  LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE expected text;
BEGIN
  SELECT a.vocabulary_list INTO expected
    FROM common.claims c JOIN common.attributes a ON a.id = c.attribute_id
    WHERE c.id = NEW.claim_id;
  IF expected IS DISTINCT FROM NEW.list THEN
    RAISE EXCEPTION 'claim_terms: the term is of the list %, the attribute takes %', NEW.list, coalesce(expected, 'no list')
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER claim_terms_list BEFORE INSERT OR UPDATE ON common.claim_terms
  FOR EACH ROW EXECUTE FUNCTION common.check_claim_term_list();
--> statement-breakpoint

-- The identity key, as the script writes it:
--   pure:<cas>:<isomeric form>                       (pure:sub:<id> for a substance without CAS)
--   natural:<species>:<part>:<process>:<chemotype>:<treatments, sorted, joined by +>
--   blend:<company id>:<name>
-- Text is lowercased with its spaces collapsed; an unknown piece is empty. The database checks
-- it at the end of each transaction, so a natural's treatments can be written after it.
CREATE FUNCTION common.normalize_key_part(part text) RETURNS text
  LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT coalesce(lower(regexp_replace(btrim(part), '\s+', ' ', 'g')), '')
$$;
--> statement-breakpoint
CREATE FUNCTION common.identity_key_of(material uuid) RETURNS text
  LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT CASE m.type
    WHEN 'pure' THEN 'pure:' || coalesce(s.cas, 'sub:' || s.id::text) || ':' || coalesce(f.code, '')
    WHEN 'natural' THEN 'natural:' || common.normalize_key_part(m.species)
      || ':' || coalesce(p.code, '') || ':' || coalesce(r.code, '')
      || ':' || common.normalize_key_part(m.chemotype)
      || ':' || coalesce((SELECT string_agg(v.code, '+' ORDER BY v.code)
                            FROM common.natural_treatments nt JOIN common.vocabularies v ON v.id = nt.treatment_id
                           WHERE nt.material_id = m.id), '')
    WHEN 'blend' THEN 'blend:' || m.company_id::text || ':' || common.normalize_key_part(m.name)
  END
  FROM common.materials m
  LEFT JOIN common.substances s ON s.id = m.substance_id
  LEFT JOIN common.vocabularies f ON f.id = m.isomeric_form_id
  LEFT JOIN common.vocabularies p ON p.id = m.part_id
  LEFT JOIN common.vocabularies r ON r.id = m.process_id
  WHERE m.id = material
$$;
--> statement-breakpoint
CREATE FUNCTION common.check_identity_key() RETURNS trigger
  LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE material uuid; written text; expected text;
BEGIN
  -- Separate branches: a CASE would read NEW.material_id on materials, which has no such column.
  IF TG_TABLE_NAME = 'materials' THEN material := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN material := OLD.material_id;
  ELSE material := NEW.material_id;
  END IF;
  SELECT m.identity_key, common.identity_key_of(m.id) INTO written, expected FROM common.materials m WHERE m.id = material;
  IF FOUND AND written IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'materials: identity_key of % is «%», it should be «%»', material, written, expected
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END $$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER materials_identity_key_checked AFTER INSERT OR UPDATE ON common.materials
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION common.check_identity_key();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER natural_treatments_identity_key_checked AFTER INSERT OR UPDATE OR DELETE ON common.natural_treatments
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION common.check_identity_key();
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION common.check_claim_term_list(), common.check_identity_key() FROM PUBLIC;
