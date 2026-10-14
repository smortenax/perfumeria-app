-- V3-49: a frozen formula comes from one of its owner's formulas, up to one event of that same
-- formula; the two go together.
CREATE OR REPLACE FUNCTION public.check_source_formula() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF (NEW.source_formula_id IS NULL) <> (NEW.source_event_id IS NULL) THEN
    RAISE EXCEPTION 'a frozen formula says its formula and the event it was frozen at, both' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.source_formula_id IS NOT NULL AND (
    NEW.kind <> 'frozen'
    OR NOT EXISTS (SELECT 1 FROM public.formulas f WHERE f.id = NEW.source_formula_id AND f.owner_id = NEW.owner_id)
    OR NOT EXISTS (SELECT 1 FROM public.formula_events e WHERE e.id = NEW.source_event_id AND e.formula_id = NEW.source_formula_id)
  ) THEN
    RAISE EXCEPTION 'only a frozen formula has a source formula, its owner''s, up to one of its events' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
