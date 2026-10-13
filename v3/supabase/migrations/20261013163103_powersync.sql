-- PowerSync reads the database through logical replication (plan v3, step 1.2; V3-9).
-- From PowerSync's Supabase guide (docs.powersync.com/integrations/supabase/guide, read 2026-10-13):
-- a role with replication, read-only access to the tables, and a publication named "powersync".
--
-- The guide sets the role's password here. It is left out so that no password reaches Git:
-- each environment sets its own, outside the repository
--   ALTER ROLE powersync_role WITH PASSWORD '...';
-- (local: `npm run db:powersync-password`; the cloud: Supabase's SQL editor, by the user).

CREATE ROLE powersync_role WITH REPLICATION BYPASSRLS LOGIN;
--> statement-breakpoint
-- Read-only access, now and for the tables still to come.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO powersync_role;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO powersync_role;
--> statement-breakpoint
-- The publication must be named "powersync".
CREATE PUBLICATION powersync FOR ALL TABLES;
