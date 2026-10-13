-- The policies of materials_rls asked the materials table from a policy of the materials
-- table itself (is the material it is based on visible?), and Postgres stops that as an
-- infinite recursion (42P17; seen in the tests of step 2.8). Two functions answer it as their
-- owner, outside RLS, for the signed-in user; every policy that asks about a material uses them.

CREATE FUNCTION public.material_visible(material uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.materials m
    WHERE m.id = material AND (m.owner_id IS NULL OR m.owner_id = (SELECT auth.uid()))
  )
$$;
--> statement-breakpoint
CREATE FUNCTION public.material_owned(material uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.materials m WHERE m.id = material AND m.owner_id = (SELECT auth.uid()))
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.material_visible(uuid) FROM PUBLIC, anon;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.material_owned(uuid) FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.material_visible(uuid) TO authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.material_owned(uuid) TO authenticated;
--> statement-breakpoint

DROP POLICY "materials: create own" ON "materials";
--> statement-breakpoint
CREATE POLICY "materials: create own" ON "materials"
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()) AND (based_on_id IS NULL OR public.material_visible(based_on_id)));
--> statement-breakpoint
DROP POLICY "materials: change own" ON "materials";
--> statement-breakpoint
CREATE POLICY "materials: change own" ON "materials"
  FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()) AND (based_on_id IS NULL OR public.material_visible(based_on_id)));
--> statement-breakpoint

DROP POLICY "material_components: read with the material" ON "material_components";
--> statement-breakpoint
CREATE POLICY "material_components: read with the material" ON "material_components"
  FOR SELECT TO authenticated USING (public.material_visible(material_id));
--> statement-breakpoint
DROP POLICY "material_components: write in own" ON "material_components";
--> statement-breakpoint
CREATE POLICY "material_components: write in own" ON "material_components"
  FOR ALL TO authenticated
  USING (public.material_owned(material_id))
  WITH CHECK (public.material_owned(material_id) AND public.material_visible(component_id));
--> statement-breakpoint

DROP POLICY "regulations: read with the material" ON "regulations";
--> statement-breakpoint
CREATE POLICY "regulations: read with the material" ON "regulations"
  FOR SELECT TO authenticated USING (public.material_visible(material_id));
--> statement-breakpoint
DROP POLICY "regulations: write in own" ON "regulations";
--> statement-breakpoint
CREATE POLICY "regulations: write in own" ON "regulations"
  FOR ALL TO authenticated
  USING (public.material_owned(material_id)) WITH CHECK (public.material_owned(material_id));
--> statement-breakpoint

DROP POLICY "material_doses: read with the material" ON "material_doses";
--> statement-breakpoint
CREATE POLICY "material_doses: read with the material" ON "material_doses"
  FOR SELECT TO authenticated USING (public.material_visible(material_id));
--> statement-breakpoint
DROP POLICY "material_doses: write in own" ON "material_doses";
--> statement-breakpoint
CREATE POLICY "material_doses: write in own" ON "material_doses"
  FOR ALL TO authenticated
  USING (public.material_owned(material_id)) WITH CHECK (public.material_owned(material_id));
--> statement-breakpoint

DROP POLICY "lab_materials: own" ON "lab_materials";
--> statement-breakpoint
CREATE POLICY "lab_materials: own" ON "lab_materials"
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.material_visible(material_id));
