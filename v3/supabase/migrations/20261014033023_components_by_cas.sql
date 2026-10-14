ALTER TABLE "material_components" DROP CONSTRAINT "material_components_not_itself";--> statement-breakpoint
ALTER TABLE "material_components" ALTER COLUMN "component_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "material_components" ADD COLUMN "component_cas" text;--> statement-breakpoint
ALTER TABLE "material_components" ADD COLUMN "component_name" text;--> statement-breakpoint
CREATE INDEX "material_components_cas_idx" ON "material_components" USING btree ("component_cas");--> statement-breakpoint
ALTER TABLE "material_components" ADD CONSTRAINT "material_components_cas_once" UNIQUE("material_id","component_cas","authority","source");--> statement-breakpoint
ALTER TABLE "material_components" ADD CONSTRAINT "material_components_what" CHECK (("material_components"."component_id" is not null and "material_components"."component_cas" is null and "material_components"."component_name" is null) or ("material_components"."component_id" is null and length(trim(coalesce("material_components"."component_name", ''))) > 0));--> statement-breakpoint
ALTER TABLE "material_components" ADD CONSTRAINT "material_components_not_ifra" CHECK ("material_components"."authority" <> 'ifra');--> statement-breakpoint
ALTER TABLE "material_components" ADD CONSTRAINT "material_components_not_itself" CHECK ("material_components"."component_id" is null or "material_components"."material_id" <> "material_components"."component_id");--> statement-breakpoint
ALTER TABLE "regulations" ADD CONSTRAINT "regulations_not_ifra" CHECK ("regulations"."authority" <> 'ifra');