-- IFRA's layer (V3-35): read-only for whoever signs in, written only by the loading script
-- (which bypasses RLS). Later, reading may depend on the account (an add-on): then these
-- policies are what changes, and the sync stream `ifra`.
ALTER TABLE "ifra_standards" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "ifra_limits" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "ifra_substances" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "ifra_annex" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "ifra_variant_rules" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "ifra_spec_exclusions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "ifra_standards: read" ON "ifra_standards" FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
CREATE POLICY "ifra_limits: read" ON "ifra_limits" FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
CREATE POLICY "ifra_substances: read" ON "ifra_substances" FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
CREATE POLICY "ifra_annex: read" ON "ifra_annex" FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
CREATE POLICY "ifra_variant_rules: read" ON "ifra_variant_rules" FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
CREATE POLICY "ifra_spec_exclusions: read" ON "ifra_spec_exclusions" FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
CREATE TRIGGER ifra_standards_touch BEFORE UPDATE ON public.ifra_standards FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER ifra_limits_touch BEFORE UPDATE ON public.ifra_limits FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER ifra_substances_touch BEFORE UPDATE ON public.ifra_substances FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER ifra_annex_touch BEFORE UPDATE ON public.ifra_annex FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER ifra_variant_rules_touch BEFORE UPDATE ON public.ifra_variant_rules FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER ifra_spec_exclusions_touch BEFORE UPDATE ON public.ifra_spec_exclusions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
