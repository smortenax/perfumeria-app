-- Your shopping list (V3-79): only yours, read and written by you, of a material you can see; the
-- formula it came from is one of yours, and the specification it became, yours.
ALTER TABLE "shopping_items" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "shopping_items: own" ON "shopping_items"
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.material_visible(material_id)
    AND (formula_id IS NULL OR public.formula_owned(formula_id))
    AND (specification_id IS NULL OR public.material_owned(specification_id))
  );
--> statement-breakpoint
CREATE TRIGGER shopping_items_touch BEFORE UPDATE ON public.shopping_items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
