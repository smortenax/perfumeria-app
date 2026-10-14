ALTER TABLE "material_relations" DROP CONSTRAINT "material_relations_other_id_materials_id_fk";
--> statement-breakpoint
ALTER TABLE "material_relations" ADD CONSTRAINT "material_relations_other_id_materials_id_fk" FOREIGN KEY ("other_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;