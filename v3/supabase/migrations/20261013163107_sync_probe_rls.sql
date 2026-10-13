-- What goes up (RLS): each user reads and writes only their own rows of the probe.
-- What goes down is decided by PowerSync's sync rules, which repeat this (V3-9).
ALTER TABLE "sync_probe" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "sync_probe: own rows" ON "sync_probe"
  FOR ALL TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));
