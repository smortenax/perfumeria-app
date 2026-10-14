CREATE TABLE "material_descriptors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"owner_id" uuid,
	"source" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "material_descriptors_source" CHECK (length(trim("material_descriptors"."source")) > 0),
	CONSTRAINT "material_descriptors_text" CHECK (length(trim("material_descriptors"."text")) > 0)
);
--> statement-breakpoint
CREATE TABLE "material_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"owner_id" uuid,
	"perfume" text NOT NULL,
	"house" text,
	"note" text,
	"sources" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "material_references_perfume" CHECK (length(trim("material_references"."perfume")) > 0)
);
--> statement-breakpoint
CREATE TABLE "material_relations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"owner_id" uuid,
	"kind" text NOT NULL,
	"other_id" uuid,
	"other_text" text,
	"note" text,
	"sources" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "material_relations_kind" CHECK ("material_relations"."kind" in ('combines', 'substitute', 'clashes')),
	CONSTRAINT "material_relations_other" CHECK ("material_relations"."other_id" is not null or length(trim(coalesce("material_relations"."other_text", ''))) > 0)
);
--> statement-breakpoint
ALTER TABLE "material_descriptors" ADD CONSTRAINT "material_descriptors_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_references" ADD CONSTRAINT "material_references_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_relations" ADD CONSTRAINT "material_relations_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_relations" ADD CONSTRAINT "material_relations_other_id_materials_id_fk" FOREIGN KEY ("other_id") REFERENCES "public"."materials"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "material_descriptors_material_idx" ON "material_descriptors" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "material_descriptors_owner_idx" ON "material_descriptors" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "material_references_material_idx" ON "material_references" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "material_references_owner_idx" ON "material_references" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "material_relations_material_idx" ON "material_relations" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "material_relations_owner_idx" ON "material_relations" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "material_relations_other_idx" ON "material_relations" USING btree ("other_id");