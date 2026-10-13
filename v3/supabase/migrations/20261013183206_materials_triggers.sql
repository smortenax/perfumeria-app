-- The rules that a CHECK cannot hold (plan v3, step 2.7). They run as the owner of the
-- function (SECURITY DEFINER), so that they see every material whoever writes, the loading
-- script included; RLS has already decided who may write.

-- updated_at, always the time of the last change.
CREATE FUNCTION public.touch_updated_at() RETURNS trigger
  LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER materials_touch BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER material_components_touch BEFORE UPDATE ON public.material_components FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER regulations_touch BEFORE UPDATE ON public.regulations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER material_doses_touch BEFORE UPDATE ON public.material_doses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER material_categories_touch BEFORE UPDATE ON public.material_categories FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint

-- A material: its owner never changes; a frozen formula stays one; it is based on a common
-- material or on one of its owner's, a common one only on a common one (V3-5); and the
-- chain of «based on» never comes back to itself.
CREATE FUNCTION public.check_material() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  base_owner uuid;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
      RAISE EXCEPTION 'the owner of a material does not change' USING ERRCODE = 'check_violation';
    END IF;
    IF (NEW.kind = 'frozen') <> (OLD.kind = 'frozen') THEN
      RAISE EXCEPTION 'a frozen formula stays frozen, and nothing else becomes one' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  IF NEW.based_on_id IS NOT NULL THEN
    SELECT owner_id INTO base_owner FROM public.materials WHERE id = NEW.based_on_id;
    IF base_owner IS NOT NULL AND base_owner IS DISTINCT FROM NEW.owner_id THEN
      RAISE EXCEPTION 'a material is based on a common one or on one of its owner''s' USING ERRCODE = 'check_violation';
    END IF;
    IF EXISTS (
      WITH RECURSIVE chain(id) AS (
        SELECT NEW.based_on_id
        UNION
        SELECT m.based_on_id FROM public.materials m JOIN chain c ON m.id = c.id WHERE m.based_on_id IS NOT NULL
      )
      SELECT 1 FROM chain WHERE id = NEW.id
    ) THEN
      RAISE EXCEPTION 'a material cannot be based, even through others, on itself' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER materials_check BEFORE INSERT OR UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.check_material();
--> statement-breakpoint

-- A component: a common material contains only common ones, a user's one only common ones
-- or the same user's; no material contains itself, even through others; and the composition
-- of a frozen formula, once written, is not changed (plan §27).
CREATE FUNCTION public.check_component() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  container public.materials%ROWTYPE;
  component_owner uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT * INTO container FROM public.materials WHERE id = OLD.material_id;
    -- When the material itself goes, its composition goes with it (ON DELETE CASCADE).
    IF FOUND AND container.kind = 'frozen' THEN
      RAISE EXCEPTION 'the composition of a frozen formula is not changed' USING ERRCODE = 'check_violation';
    END IF;
    RETURN OLD;
  END IF;
  SELECT * INTO container FROM public.materials WHERE id = NEW.material_id;
  IF TG_OP = 'UPDATE' AND container.kind = 'frozen' THEN
    RAISE EXCEPTION 'the composition of a frozen formula is not changed' USING ERRCODE = 'check_violation';
  END IF;
  SELECT owner_id INTO component_owner FROM public.materials WHERE id = NEW.component_id;
  IF component_owner IS NOT NULL AND component_owner IS DISTINCT FROM container.owner_id THEN
    RAISE EXCEPTION 'a common material contains only common materials, and a user''s only common ones or that user''s'
      USING ERRCODE = 'check_violation';
  END IF;
  IF EXISTS (
    WITH RECURSIVE reach(id) AS (
      SELECT NEW.component_id
      UNION
      SELECT mc.component_id FROM public.material_components mc JOIN reach r ON mc.material_id = r.id
    )
    SELECT 1 FROM reach WHERE id = NEW.material_id
  ) THEN
    RAISE EXCEPTION 'a material cannot contain itself, even through others' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER material_components_check BEFORE INSERT OR UPDATE OR DELETE ON public.material_components
  FOR EACH ROW EXECUTE FUNCTION public.check_component();
--> statement-breakpoint

-- The functions are for the triggers only.
REVOKE EXECUTE ON FUNCTION public.check_material() FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.check_component() FROM PUBLIC, anon, authenticated;
