ALTER TABLE "materials" ADD COLUMN "impact" smallint;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "impact_source" text;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_impact" CHECK ("materials"."impact" is null or "materials"."impact" between 1 and 10);