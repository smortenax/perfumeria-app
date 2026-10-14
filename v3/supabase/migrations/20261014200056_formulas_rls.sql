-- Your formulas (plan v3, step 7.3; V3-10, V3-19): workbenches, formulas and their history are
-- only yours. A formula lives in one of your workbenches, and a version comes from one of your
-- formulas. A history is only added to: no policy updates or deletes an event (undoing adds the
-- opposite one, plan 8.2); deleting the formula takes its history with it.
CREATE FUNCTION public.formula_owned(formula uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.formulas f WHERE f.id = formula AND f.owner_id = (SELECT auth.uid()))
$$;
--> statement-breakpoint
CREATE FUNCTION public.workbench_owned(workbench uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.workbenches w WHERE w.id = workbench AND w.owner_id = (SELECT auth.uid()))
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.formula_owned(uuid) FROM PUBLIC, anon;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.workbench_owned(uuid) FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.formula_owned(uuid) TO authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.workbench_owned(uuid) TO authenticated;
--> statement-breakpoint
ALTER TABLE "workbenches" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "formulas" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "formula_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "workbenches: own" ON "workbenches"
  FOR ALL TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));
--> statement-breakpoint
CREATE POLICY "formulas: own" ON "formulas"
  FOR ALL TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    AND public.workbench_owned(workbench_id)
    AND (parent_id IS NULL OR public.formula_owned(parent_id))
  );
--> statement-breakpoint
CREATE POLICY "formula_events: read with the formula" ON "formula_events"
  FOR SELECT TO authenticated USING (public.formula_owned(formula_id));
--> statement-breakpoint
CREATE POLICY "formula_events: only added" ON "formula_events"
  FOR INSERT TO authenticated WITH CHECK (public.formula_owned(formula_id));
--> statement-breakpoint

-- Whoever writes (here, also the import script): a formula's workbench and mother are its
-- owner's, and its owner does not change.
CREATE FUNCTION public.check_formula() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
    RAISE EXCEPTION 'the owner of a formula does not change' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.workbenches w WHERE w.id = NEW.workbench_id AND w.owner_id = NEW.owner_id) THEN
    RAISE EXCEPTION 'a formula lives in a workbench of its owner' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.parent_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.formulas f WHERE f.id = NEW.parent_id AND f.owner_id = NEW.owner_id) THEN
    RAISE EXCEPTION 'a version comes from a formula of its owner' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER formulas_check BEFORE INSERT OR UPDATE ON public.formulas FOR EACH ROW EXECUTE FUNCTION public.check_formula();
--> statement-breakpoint

-- An event carries its formula's owner, uses only common materials or its owner's, and a
-- set_mass or remove points at a pour of the same formula. Never changed once written.
CREATE FUNCTION public.check_formula_event() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  formula_owner uuid;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'a history is only added to: undoing adds the opposite event' USING ERRCODE = 'check_violation';
  END IF;
  SELECT owner_id INTO formula_owner FROM public.formulas WHERE id = NEW.formula_id;
  NEW.owner_id := formula_owner;
  IF EXISTS (
    SELECT 1 FROM public.materials m
    WHERE m.id IN (NEW.material_id, NEW.diluent_id, NEW.second_diluent_id)
      AND m.owner_id IS NOT NULL AND m.owner_id IS DISTINCT FROM formula_owner
  ) THEN
    RAISE EXCEPTION 'a formula uses only common materials or its owner''s' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.target IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.formula_events e WHERE e.id = NEW.target AND e.formula_id = NEW.formula_id AND e.kind = 'add'
  ) THEN
    RAISE EXCEPTION 'a change points at a pour of the same formula' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER formula_events_check BEFORE INSERT OR UPDATE ON public.formula_events FOR EACH ROW EXECUTE FUNCTION public.check_formula_event();
--> statement-breakpoint

-- A frozen formula's formula (V3-10) is its owner's.
CREATE FUNCTION public.check_source_formula() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.source_formula_id IS NOT NULL AND (
    NEW.kind <> 'frozen'
    OR NOT EXISTS (SELECT 1 FROM public.formulas f WHERE f.id = NEW.source_formula_id AND f.owner_id = NEW.owner_id)
  ) THEN
    RAISE EXCEPTION 'only a frozen formula has a source formula, and it is its owner''s' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER materials_source_formula BEFORE INSERT OR UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.check_source_formula();
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.check_formula() FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.check_formula_event() FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.check_source_formula() FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
CREATE TRIGGER workbenches_touch BEFORE UPDATE ON public.workbenches FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER formulas_touch BEFORE UPDATE ON public.formulas FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
