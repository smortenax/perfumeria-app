-- Your bottles (V3-65, V3-67): each diluent of a bottle is yours, of one of your bottles, and a diluent
-- you can see (a common one or yours). A bottle made from another is made from one of yours, of the
-- same material.
ALTER TABLE "lab_dilution_diluents" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "lab_dilution_diluents: own" ON "lab_dilution_diluents"
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.lab_dilution_owned(dilution_id) AND public.material_visible(diluent_id));
--> statement-breakpoint

-- Whoever writes (also a loading script): a diluent row is its bottle's owner's, of a material that
-- owner can see; it never moves to another bottle.
CREATE FUNCTION public.check_lab_dilution_diluent() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.dilution_id IS DISTINCT FROM OLD.dilution_id) THEN
    RAISE EXCEPTION 'a diluent of a bottle keeps its owner and its bottle' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.lab_dilutions d WHERE d.id = NEW.dilution_id AND d.user_id = NEW.user_id) THEN
    RAISE EXCEPTION 'a diluent belongs to a bottle of its owner' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.materials m WHERE m.id = NEW.diluent_id AND (m.owner_id IS NULL OR m.owner_id = NEW.user_id)) THEN
    RAISE EXCEPTION 'a diluent is a common material or its owner''s' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER lab_dilution_diluents_check BEFORE INSERT OR UPDATE ON public.lab_dilution_diluents FOR EACH ROW EXECUTE FUNCTION public.check_lab_dilution_diluent();
--> statement-breakpoint
CREATE FUNCTION public.check_lab_dilution_source() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.source_dilution_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.lab_dilutions s WHERE s.id = NEW.source_dilution_id AND s.user_id = NEW.user_id AND s.material_id = NEW.material_id
  ) THEN
    RAISE EXCEPTION 'a bottle is made from another of its owner, of the same material' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER lab_dilutions_source BEFORE INSERT OR UPDATE ON public.lab_dilutions FOR EACH ROW EXECUTE FUNCTION public.check_lab_dilution_source();
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.check_lab_dilution_diluent() FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.check_lab_dilution_source() FROM PUBLIC, anon, authenticated;
