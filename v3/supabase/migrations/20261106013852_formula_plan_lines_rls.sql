-- The plan of a formula (V3-98): only yours, of a formula of yours, with a material you can see.
ALTER TABLE "formula_plan_lines" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "formula_plan_lines: own" ON "formula_plan_lines"
  FOR ALL TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()) AND public.formula_owned(formula_id) AND public.material_visible(material_id));
--> statement-breakpoint
CREATE TRIGGER formula_plan_lines_touch BEFORE UPDATE ON public.formula_plan_lines FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
