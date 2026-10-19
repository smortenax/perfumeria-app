-- The third diluent of a pour and on (V3-67): read and added with its formula, never changed, as
-- the history it belongs to. And the bottle a pour came from is one of the formula owner's, of the
-- material poured.
CREATE FUNCTION public.formula_event_owned(event uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.formula_events e JOIN public.formulas f ON f.id = e.formula_id
    WHERE e.id = event AND f.owner_id = (SELECT auth.uid())
  )
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.formula_event_owned(uuid) FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.formula_event_owned(uuid) TO authenticated;
--> statement-breakpoint
ALTER TABLE "formula_event_diluents" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "formula_event_diluents: read with the formula" ON "formula_event_diluents"
  FOR SELECT TO authenticated USING (public.formula_event_owned(event_id));
--> statement-breakpoint
CREATE POLICY "formula_event_diluents: only added" ON "formula_event_diluents"
  FOR INSERT TO authenticated WITH CHECK (public.formula_event_owned(event_id));
--> statement-breakpoint

-- Whoever writes: it carries its pour's owner, hangs from a pour in a mixture (one with a second
-- diluent), uses a common diluent or its owner's, and is never changed once written.
CREATE FUNCTION public.check_formula_event_diluent() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  event_owner uuid;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'a history is only added to: undoing adds the opposite event' USING ERRCODE = 'check_violation';
  END IF;
  SELECT f.owner_id INTO event_owner
  FROM public.formula_events e JOIN public.formulas f ON f.id = e.formula_id
  WHERE e.id = NEW.event_id AND e.kind = 'add' AND e.second_diluent_id IS NOT NULL;
  IF event_owner IS NULL THEN
    RAISE EXCEPTION 'a third diluent hangs from a pour in a mixture' USING ERRCODE = 'check_violation';
  END IF;
  NEW.owner_id := event_owner;
  IF NOT EXISTS (SELECT 1 FROM public.materials m WHERE m.id = NEW.diluent_id AND (m.owner_id IS NULL OR m.owner_id = event_owner)) THEN
    RAISE EXCEPTION 'a formula uses only common materials or its owner''s' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER formula_event_diluents_check BEFORE INSERT OR UPDATE ON public.formula_event_diluents FOR EACH ROW EXECUTE FUNCTION public.check_formula_event_diluent();
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.check_formula_event_diluent() FROM PUBLIC, anon, authenticated;
--> statement-breakpoint

-- A pour's bottle: the formula owner's, of the material poured.
CREATE FUNCTION public.check_formula_event_dilution() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.dilution_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.lab_dilutions d JOIN public.formulas f ON f.id = NEW.formula_id
    WHERE d.id = NEW.dilution_id AND d.user_id = f.owner_id AND d.material_id = NEW.material_id
  ) THEN
    RAISE EXCEPTION 'a pour comes from a bottle of the formula''s owner, of the material poured' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER formula_events_dilution BEFORE INSERT ON public.formula_events FOR EACH ROW EXECUTE FUNCTION public.check_formula_event_dilution();
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.check_formula_event_dilution() FROM PUBLIC, anon, authenticated;
