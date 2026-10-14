-- Your lab (V3-36): your dilutions, your tasting and your axes, as «what I have»
-- (lab_materials): only yours, read and written by you, about a material you can see.
ALTER TABLE "lab_dilutions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "lab_evaluations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "lab_axes" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "lab_dilutions: own" ON "lab_dilutions"
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.material_visible(material_id));
--> statement-breakpoint
CREATE POLICY "lab_evaluations: own" ON "lab_evaluations"
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.material_visible(material_id));
--> statement-breakpoint
CREATE POLICY "lab_axes: own" ON "lab_axes"
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.material_visible(material_id));
--> statement-breakpoint
CREATE TRIGGER lab_dilutions_touch BEFORE UPDATE ON public.lab_dilutions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER lab_evaluations_touch BEFORE UPDATE ON public.lab_evaluations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
