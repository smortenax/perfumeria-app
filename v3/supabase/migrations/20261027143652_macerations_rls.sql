-- A formula macerating (V3-83): only yours, of a formula of yours.
ALTER TABLE "macerations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "macerations: own" ON "macerations"
  FOR ALL TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()) AND public.formula_owned(formula_id));
--> statement-breakpoint
CREATE TRIGGER macerations_touch BEFORE UPDATE ON public.macerations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
