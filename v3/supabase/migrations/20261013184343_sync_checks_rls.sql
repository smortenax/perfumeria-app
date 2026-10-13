-- The exactness check (plan v3, step 3.1): each user only their own rows.
ALTER TABLE "sync_checks" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "sync_checks: own" ON "sync_checks"
  FOR ALL TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));
