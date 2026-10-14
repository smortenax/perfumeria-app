-- The glossary's lists (V3-36): descriptors, relations and reference perfumes, as the doses.
-- Read with their material; written only in one's own; their owner is their material's,
-- copied by a trigger, so that PowerSync filters by it (inherited_owner_trigger).
ALTER TABLE "material_descriptors" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "material_relations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "material_references" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "material_descriptors: read with the material" ON "material_descriptors"
  FOR SELECT TO authenticated USING (public.material_visible(material_id));
--> statement-breakpoint
CREATE POLICY "material_descriptors: write in own" ON "material_descriptors"
  FOR ALL TO authenticated
  USING (public.material_owned(material_id)) WITH CHECK (public.material_owned(material_id));
--> statement-breakpoint
CREATE POLICY "material_relations: read with the material" ON "material_relations"
  FOR SELECT TO authenticated USING (public.material_visible(material_id));
--> statement-breakpoint
CREATE POLICY "material_relations: write in own" ON "material_relations"
  FOR ALL TO authenticated
  USING (public.material_owned(material_id))
  WITH CHECK (public.material_owned(material_id) AND (other_id IS NULL OR public.material_visible(other_id)));
--> statement-breakpoint
CREATE POLICY "material_references: read with the material" ON "material_references"
  FOR SELECT TO authenticated USING (public.material_visible(material_id));
--> statement-breakpoint
CREATE POLICY "material_references: write in own" ON "material_references"
  FOR ALL TO authenticated
  USING (public.material_owned(material_id)) WITH CHECK (public.material_owned(material_id));
--> statement-breakpoint
CREATE TRIGGER material_descriptors_owner BEFORE INSERT OR UPDATE ON public.material_descriptors
  FOR EACH ROW EXECUTE FUNCTION public.inherit_owner();
--> statement-breakpoint
CREATE TRIGGER material_relations_owner BEFORE INSERT OR UPDATE ON public.material_relations
  FOR EACH ROW EXECUTE FUNCTION public.inherit_owner();
--> statement-breakpoint
CREATE TRIGGER material_references_owner BEFORE INSERT OR UPDATE ON public.material_references
  FOR EACH ROW EXECUTE FUNCTION public.inherit_owner();
--> statement-breakpoint
CREATE TRIGGER material_descriptors_touch BEFORE UPDATE ON public.material_descriptors FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER material_relations_touch BEFORE UPDATE ON public.material_relations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER material_references_touch BEFORE UPDATE ON public.material_references FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint

-- A relation of a common material points only to a common one, as its composition: the common
-- glossary never names a user's material. A user's may point to a common one or to their own.
CREATE FUNCTION public.check_relation() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  own uuid;
  other uuid;
BEGIN
  IF NEW.other_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT owner_id INTO own FROM public.materials WHERE id = NEW.material_id;
  SELECT owner_id INTO other FROM public.materials WHERE id = NEW.other_id;
  IF other IS NOT NULL AND other IS DISTINCT FROM own THEN
    RAISE EXCEPTION 'a common material relates only to common ones, and a user''s to common ones or that user''s'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.check_relation() FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
CREATE TRIGGER material_relations_check BEFORE INSERT OR UPDATE ON public.material_relations
  FOR EACH ROW EXECUTE FUNCTION public.check_relation();
