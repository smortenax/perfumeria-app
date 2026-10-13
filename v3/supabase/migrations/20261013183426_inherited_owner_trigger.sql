-- The composition, the regulations and the doses carry their material's owner, copied here
-- whatever the writer sends: PowerSync filters by it, one bucket for the common rows and one
-- per user. Filtering through a JOIN made one bucket per material, and PowerSync allows 1,000
-- per connection by default (docs.powersync.com, performance and limits, read 2026-10-13),
-- fewer than the common materials. The owner of a material never changes (check_material).
CREATE FUNCTION public.inherit_owner() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  SELECT owner_id INTO NEW.owner_id FROM public.materials WHERE id = NEW.material_id;
  RETURN NEW;
END $$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.inherit_owner() FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
CREATE TRIGGER material_components_owner BEFORE INSERT OR UPDATE ON public.material_components
  FOR EACH ROW EXECUTE FUNCTION public.inherit_owner();
--> statement-breakpoint
CREATE TRIGGER regulations_owner BEFORE INSERT OR UPDATE ON public.regulations
  FOR EACH ROW EXECUTE FUNCTION public.inherit_owner();
--> statement-breakpoint
CREATE TRIGGER material_doses_owner BEFORE INSERT OR UPDATE ON public.material_doses
  FOR EACH ROW EXECUTE FUNCTION public.inherit_owner();
--> statement-breakpoint
UPDATE public.material_components c SET owner_id = m.owner_id FROM public.materials m WHERE m.id = c.material_id;
--> statement-breakpoint
UPDATE public.regulations r SET owner_id = m.owner_id FROM public.materials m WHERE m.id = r.material_id;
--> statement-breakpoint
UPDATE public.material_doses d SET owner_id = m.owner_id FROM public.materials m WHERE m.id = d.material_id;
