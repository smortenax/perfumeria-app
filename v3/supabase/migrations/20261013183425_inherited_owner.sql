ALTER TABLE "material_components" ADD COLUMN "owner_id" uuid;--> statement-breakpoint
ALTER TABLE "material_doses" ADD COLUMN "owner_id" uuid;--> statement-breakpoint
ALTER TABLE "regulations" ADD COLUMN "owner_id" uuid;--> statement-breakpoint
CREATE INDEX "material_components_owner_idx" ON "material_components" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "material_doses_owner_idx" ON "material_doses" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "regulations_owner_idx" ON "regulations" USING btree ("owner_id");