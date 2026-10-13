-- What goes up (plan v3, step 2.6; plan §36–37). The common rows (owner_id null) every
-- signed-in user reads and nobody writes: only the loading script, with the service key,
-- which RLS does not stop. Each user reads and writes their own rows, and nobody else's.
-- The tables that hang from a material (composition, regulations, doses) follow it.
-- What goes down to each browser is PowerSync's sync config, which repeats these rules (V3-9).

ALTER TABLE "materials" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "materials: read common and own" ON "materials"
  FOR SELECT TO authenticated
  USING (owner_id IS NULL OR owner_id = (SELECT auth.uid()));
--> statement-breakpoint
-- A new material is the user's, and based on one they can see: a common one or their own (V3-5).
CREATE POLICY "materials: create own" ON "materials"
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    AND (based_on_id IS NULL OR EXISTS (SELECT 1 FROM "materials" b WHERE b.id = based_on_id))
  );
--> statement-breakpoint
CREATE POLICY "materials: change own" ON "materials"
  FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    AND (based_on_id IS NULL OR EXISTS (SELECT 1 FROM "materials" b WHERE b.id = based_on_id))
  );
--> statement-breakpoint
CREATE POLICY "materials: delete own" ON "materials"
  FOR DELETE TO authenticated
  USING (owner_id = (SELECT auth.uid()));
--> statement-breakpoint

-- The composition: seen with its material; written only in one's own, and only with
-- components one can see (common or one's own).
ALTER TABLE "material_components" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "material_components: read with the material" ON "material_components"
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM "materials" m WHERE m.id = material_id));
--> statement-breakpoint
CREATE POLICY "material_components: write in own" ON "material_components"
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM "materials" m WHERE m.id = material_id AND m.owner_id = (SELECT auth.uid())))
  WITH CHECK (
    EXISTS (SELECT 1 FROM "materials" m WHERE m.id = material_id AND m.owner_id = (SELECT auth.uid()))
    AND EXISTS (SELECT 1 FROM "materials" c WHERE c.id = component_id)
  );
--> statement-breakpoint

ALTER TABLE "regulations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "regulations: read with the material" ON "regulations"
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM "materials" m WHERE m.id = material_id));
--> statement-breakpoint
CREATE POLICY "regulations: write in own" ON "regulations"
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM "materials" m WHERE m.id = material_id AND m.owner_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM "materials" m WHERE m.id = material_id AND m.owner_id = (SELECT auth.uid())));
--> statement-breakpoint

ALTER TABLE "material_doses" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "material_doses: read with the material" ON "material_doses"
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM "materials" m WHERE m.id = material_id));
--> statement-breakpoint
CREATE POLICY "material_doses: write in own" ON "material_doses"
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM "materials" m WHERE m.id = material_id AND m.owner_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM "materials" m WHERE m.id = material_id AND m.owner_id = (SELECT auth.uid())));
--> statement-breakpoint

-- The categories and the data version are common: read by all, written only by the script.
ALTER TABLE "material_categories" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "material_categories: read" ON "material_categories"
  FOR SELECT TO authenticated
  USING (true);
--> statement-breakpoint
ALTER TABLE "data_version" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "data_version: read" ON "data_version"
  FOR SELECT TO authenticated
  USING (true);
--> statement-breakpoint

-- «Lo que tengo» (V3-3): only one's own marks, and only on materials one can see.
ALTER TABLE "lab_materials" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "lab_materials: own" ON "lab_materials"
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (SELECT 1 FROM "materials" m WHERE m.id = material_id)
  );
