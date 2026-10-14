-- Step 4.2 let a component be a substance by its CAS and name, without component_id (V3-35, V3-36),
-- but the policy kept asking that component_id be a material the user can see: a NULL is not one,
-- so a user's own certificate could not go up (found in step 6.3; db-tests/repository.test.ts).
-- A component is now a visible material or a substance; the triggers of step 2.7 still check the
-- material case.
DROP POLICY "material_components: write in own" ON "material_components";
--> statement-breakpoint
CREATE POLICY "material_components: write in own" ON "material_components"
  FOR ALL TO authenticated
  USING (public.material_owned(material_id))
  WITH CHECK (public.material_owned(material_id) AND (component_id IS NULL OR public.material_visible(component_id)));
