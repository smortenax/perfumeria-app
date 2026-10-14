CREATE UNIQUE INDEX "materials_common_abbreviation" ON "materials" USING btree ("abbreviation") WHERE "materials"."owner_id" is null;--> statement-breakpoint
ALTER TABLE "materials" DROP COLUMN "evolution";--> statement-breakpoint
ALTER TABLE "materials" DROP COLUMN "tenacity";