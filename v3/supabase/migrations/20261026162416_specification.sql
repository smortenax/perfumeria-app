ALTER TABLE "materials" ADD COLUMN "lot" text;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "purchased_on" date;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "origin_region" text;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "status" text;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_status" CHECK ("materials"."status" is null or ("materials"."status" in ('in_use', 'running_low', 'depleted', 'archived') and "materials"."owner_id" is not null));